import nodemailer from "nodemailer";
import fs from "fs";
import ejs from "ejs";
import { htmlToText } from "html-to-text";
import juice from "juice";
import settings from "../settings";

const smtp = nodemailer.createTransport({
  host: env('SMTP_HOST'),
  port: env('SMTP_PORT'),
  secure: process.env.NODE_ENV !== "development",
  auth: {
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
  },
});

export default ({ template: templateName, templateVars, ...restOfOptions }) => {
  const templatePath = `./templates/${templateName}.html`;
  const options = {
    ...restOfOptions,
  };

  if (templateName && fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    options.html = htmlWithStylesInlined;
    options.text = text;
  }

  return smtp.sendMail(options);
};
