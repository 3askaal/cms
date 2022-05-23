'use strict';

/**
 *  order controller
 */

const getAmountInCents = (amount) => parseInt(amount) * 100

const { createCoreController } = require('@strapi/strapi').factories;
const stripe = require('stripe')(process.env.STRIPE_SK);

module.exports = createCoreController('api::order.order', ({ strapi }) =>  ({
  async create(ctx) {
    const { productIds, info } = ctx.request.body

    if (!productId) {
      return ctx.throw(400, 'No product specified.')
    }

    const products = await Promise.all(productIds.map((productId) => strapi.services['api::product.product'].findOne(productId)));

    if (!products || !products.length) {
      return ctx.throw(400, 'No products found.')
    }

    const baseUrl = ctx.request.headers.origin || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: info.email,
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl,
      line_items: products.map((product) => [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.title
            },
            unit_amount: getAmountInCents(product.price)
          },
          quantity: 1
        }
      ])
    })

    const order = await strapi.services['api::order.order'].create({
      data: {
        product: product.id,
        total: product.price,
        status: 'unpaid',
        checkout_session: session.id,
        publishedAt: new Date(),
      }
    })

    return { id: session.id }
  }
}))
