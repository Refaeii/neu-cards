# Neu Cards

Neumorphic (soft beige "Maple") cards for Home Assistant, with a visual editor for every card.

Cards: `neu-room-card`, `neu-media-card`, `neu-shutter-card`, `neu-header-card`, `neu-title-card`,
`neu-scenes-card`, `neu-scene-card`, `neu-gauges-card`, `neu-security-card`.

## Requirements
- [button-card](https://github.com/custom-cards/button-card) (HACS)
- The `button_card_templates` block from `extras/button_card_templates.yaml` at the top of your dashboard raw config
- Theme `extras/maple_neu_theme.yaml` → `/config/themes/`
- Package `extras/maple_dashboard_package.yaml` → `/config/packages/` (house mode helper)
- Fonts resource (Stylesheet): `https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Nunito+Sans:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap`

## Install
HACS → ⋮ → Custom repositories → this repo URL, type **Dashboard** → Download.
