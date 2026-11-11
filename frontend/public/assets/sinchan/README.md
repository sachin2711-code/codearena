# Crayon Shin-chan Assets Directory

Place your custom Shinchan PNG, SVG, or WebP images in this directory (`/public/assets/sinchan/`).

## Supported Image Names & Fallback Architecture
The `<ThemedBackground />` component and custom cursor system automatically check this folder for your character assets. If a file is not present, CodeArena seamlessly falls back to high-fidelity, hand-crafted SVG sticker components!

### Recommended Image Files:
1. `shinchan-waving.png` or `shinchan-happy.png` - Shinchan smiling/waving sticker (placed in bottom corners).
2. `chocobi-box.png` - Iconic green hexagonal Chocobi box with the pink dinosaur.
3. `shiro-dog.png` - Shiro, Shinchan's fluffy white pet dog.
4. `action-kamen.png` - Action Kamen superhero pose.
5. `shinchan-cursor.png` - (32x32px transparent PNG) Custom mouse cursor.
6. `chocobi-cursor.png` - (32x32px transparent PNG) Interactive pointer cursor.

### File Specifications:
- **Format**: Transparent PNG, SVG, or WebP.
- **Recommended resolution**: 128x128px to 256x256px (for background stickers) and 32x32px (for cursors).
- **Backgrounds**: Must have transparent backgrounds for sticker outline styling.
