import fs from "node:fs";
import path from "node:path";
import site from "../site-data.mjs";

const fail = (message) => {
  throw new Error(`site-data.mjs: ${message}`);
};
const required = (value, label) => {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be filled in`);
};
const url = (value, label, protocols = ["https:"]) => {
  required(value, label);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid URL`);
  }
  if (!protocols.includes(parsed.protocol)) fail(`${label} has an unsupported protocol`);
};

required(site.master.name, "master.name");
required(site.master.dative, "master.dative");
required(site.master.genitive, "master.genitive");
required(site.master.instrumental, "master.instrumental");
required(site.master.heroCopy, "master.heroCopy");
required(site.location.address, "location.address");
required(site.contacts.phoneDisplay, "contacts.phoneDisplay");
url(site.contacts.phoneHref, "contacts.phoneHref", ["tel:"]);
url(site.links.bookingUrl, "links.bookingUrl");
url(site.links.reviewsUrl, "links.reviewsUrl");
url(site.links.mapUrl, "links.mapUrl");
url(site.links.routeUrl, "links.routeUrl");
url(site.contacts.personalTelegramUrl, "contacts.personalTelegramUrl");
url(site.contacts.vkUrl, "contacts.vkUrl");

const categoryKeys = ["manicure", "pedicure", "podology", "training"];
const services = [];
for (const key of categoryKeys) {
  required(site.template.categoryLabels[key], `template.categoryLabels.${key}`);
  if (!Array.isArray(site.services[key])) fail(`services.${key} must be an array`);
  for (const [index, item] of site.services[key].entries()) {
    required(item.name, `services.${key}[${index}].name`);
    url(item.url, `services.${key}[${index}].url`);
    const hasPrice = typeof item.price === "string" && item.price.trim();
    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
    if (!hasPrice && !hasVariants) fail(`services.${key}[${index}] needs a price or variants`);
    if (hasVariants) {
      for (const [variantIndex, variant] of item.variants.entries()) {
        required(variant.label, `services.${key}[${index}].variants[${variantIndex}].label`);
        required(variant.price, `services.${key}[${index}].variants[${variantIndex}].price`);
      }
    }
    services.push(item);
  }
}
if (!services.length) fail("at least one service is required");
if (!Array.isArray(site.images.gallery) || site.images.gallery.length < 5) {
  fail("images.gallery needs at least five photographs to preserve the Julia layout");
}
if (!Array.isArray(site.reviews) || !site.reviews.length) fail("at least one review is required");

const imagePaths = [
  site.images.portrait,
  site.images.about,
  site.images.favicon,
  site.images.introLogo,
  site.images.headerLogo,
  site.images.heroDecoration,
  ...site.images.gallery.map((item) => item.src),
];
for (const [index, imagePath] of imagePaths.entries()) {
  required(imagePath, `image path ${index + 1}`);
  const withoutBase = site.basePath && imagePath.startsWith(site.basePath)
    ? imagePath.slice(site.basePath.length)
    : imagePath;
  if (!withoutBase.startsWith("/assets/")) fail(`${imagePath} must be inside public/assets`);
  const absolutePath = path.resolve("public", withoutBase.slice(1));
  const publicRoot = path.resolve("public");
  if (!absolutePath.startsWith(`${publicRoot}${path.sep}`)) fail(`${imagePath} escapes public/assets`);
  if (!fs.existsSync(absolutePath)) fail(`${imagePath} does not exist`);
}

console.log(`Validated ${services.length} services and ${site.images.gallery.length} gallery images for ${site.master.name}.`);
