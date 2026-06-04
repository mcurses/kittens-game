---
name: kittensgame-design
description: Use this skill to generate well-branded interfaces and assets for Kittens Game (a Dark Souls of incremental gaming, by bloodrizer/nuclear-unicorn), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and a UI kit recreating the three-column game shell across three eras (Catnip Forest → Iron Will → Helios).
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `assets/` and create static HTML files for the user to view. Reference `colors_and_type.css` for tokens; pick the era (`data-era="forest|iron|helios"`) that matches the moment in the game arc.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The voice in `README.md` (CONTENT FUNDAMENTALS) is non-negotiable — match it or the design feels dead.

If the user invokes this skill without any other guidance, ask them what they want to build or design. Useful clarifying questions:

- Which era? Catnip Forest (warm parchment), Iron Will (slate), or Helios (cobalt + cyan)?
- Which surface? Game screen, marketing site, splash, achievements grid, lore page, settings dialog?
- Do they want pixel-art sprites integrated, or are placeholders fine?

Then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need. Default to building from the existing UI kit components in `ui_kits/kittensgame/` rather than reinventing them.
