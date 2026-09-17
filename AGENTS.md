# Hair template rules

- This repository is the visual golden master for all TANEM hair-master sites.
- Keep the rendered design identical to `https://julia.tanem.ru/` unless the owner explicitly approves a template-version change.
- For a new client, edit only `site-data.mjs` and that client's folder under `public/assets/`.
- Never copy content or images from another master.
- Do not add client-specific JSX, CSS overrides, post-build patches, or duplicated HTML.
- Represent prices by hair length with `variants`; do not flatten short, medium, and long hair into prose.
- Keep the four visible service groups data-driven. Empty groups may be hidden; do not rename the internal keys.
- Run `npm test` and `npm run lint` before publication, then compare mobile and desktop renders visually.
