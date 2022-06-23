'use strict';

/**
 *  order controller
 */

const getAmountInCents = (amount) => parseInt(amount) * 100

const { createCoreController } = require('@strapi/strapi').factories;
const { sanitize } = require('@strapi/utils');
const stripe = require('stripe')(process.env.STRIPE_SK);
const sendEmail = require('../../../email')

module.exports = createCoreController('api::order.order', ({ strapi }) =>  ({
  async create(ctx) {
    const { productIds, customerInfo } = ctx.request.body

    if (!productIds || !productIds.length) {
      return ctx.throw(400, 'No product id\'s specified.')
    }

    const products = await Promise.all(productIds.map((productId) => strapi.services['api::product.product'].findOne(productId)));

    if (!products.length) {
      return ctx.throw(400, 'No products found.')
    }

    const baseUrl = ctx.request.headers.origin || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerInfo.email,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/status/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/status/{CHECKOUT_SESSION_ID}`,
      line_items: products.map((product) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.title
          },
          unit_amount: getAmountInCents(product.price)
        },
        quantity: 1
      }))
    })

    const order = await strapi.services['api::order.order'].create({
      data: {
        products: products.map(({ id }) => id),
        total: products.reduce((accumulator, { price }) => accumulator + price, 0),
        status: 'unpaid',
        checkout_session: session.id,
        publishedAt: new Date(),
        customerInfo
      }
    })

    return { sessionId: session.id }
  },

  async confirm(ctx) {
    const { sessionId } = ctx.request.body

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const [order] = await strapi.entityService.findMany(
        'api::order.order',
        {
          filters: {
            checkout_session: sessionId
          }
        }
      )

      await strapi.services['api::order.order'].update(order.id, {
        data: {
          status: 'paid'
        },
      })

      const updatedOrder = await strapi.entityService.findOne(
        'api::order.order',
        order.id,
        {
          populate: '*'
        }
      )

      await sendEmail({
        to: order.customerInfo.email,
        from: env('SUPPORT_EMAIL'),
        subject: 'We received your order',
        template: 'order-success',
        templateVars: {
          emailAddress: order.customerInfo.email,
        },
      });

      return sanitize.contentAPI.output(updatedOrder);
    } else {
      ctx.throw(400, 'Payment not successful.');
    }
  }
}))
