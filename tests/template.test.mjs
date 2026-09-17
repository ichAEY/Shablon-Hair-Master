import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import site from "../site-data.mjs";

const html = fs.readFileSync("out/index.html", "utf8");

test("the static export contains the configured master and all service groups", () => {
  assert.match(html, new RegExp(site.master.name));
  for (const label of Object.values(site.template.categoryLabels)) assert.match(html, new RegExp(label));
  for (const group of Object.values(site.services)) {
    for (const service of group) {
      assert.ok(html.includes(service.name), `missing service: ${service.name}`);
      for (const variant of service.variants ?? []) {
        assert.ok(html.includes(variant.label), `missing variant: ${variant.label}`);
        assert.ok(html.includes(variant.price), `missing variant price: ${variant.price}`);
      }
    }
  }
});

test("Julia's identity lives in site-data, not in the reusable component", () => {
  const component = fs.readFileSync("app/mobile-claytone.tsx", "utf8");
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  assert.ok(!component.includes("Юлия Ролева"));
  assert.ok(!layout.includes("Юлия Ролева"));
  assert.ok(!component.includes("79248395829"));
  assert.ok(!layout.includes("111558185"));
});

test("the hair template contains no content from other TANEM masters", () => {
  for (const foreignName of ["Нонна", "Тахмина", "Maria Mayer", "Snezhana", "Chistomanik"]) {
    assert.ok(!html.includes(foreignName), `foreign client data found: ${foreignName}`);
  }
});
