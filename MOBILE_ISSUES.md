# Mobile Issues Analysis

The following issues were identified that prevent a good experience on mobile devices:

1. **Fixed Canvas Resolution**: The simulator uses a fixed 1200x800 canvas. This results in:
   - Blurriness on high-DPI (Retina) mobile screens.
   - Poor scaling on small viewports.
2. **Keyboard-Only Controls**: Movement (WASD/Arrows) and actions (F for Fusion, V for Spectator) are bound only to keyboard events. Mobile users cannot interact with the simulator.
3. **Desktop-Centric UI Instructions**:
   - `IntroOverlay.jsx` explicitly tells users to use WASD/Arrows and F.
   - `ExperiencePanel.jsx` prompts users to "Press F to fuse".
4. **Layout Constraints**: The sidebar elements (Experience Panel, Agent List) stack below the canvas on mobile, which may lead to excessive scrolling or a disconnected experience.
5. **Lack of Touch Interaction**: No touch-to-move or virtual joystick implementation.

## Proposed Fixes

1. **Responsive Canvas**: Implement a `useResize` hook or similar to handle canvas resizing and DPR (Device Pixel Ratio) scaling.
2. **Mobile Controls**:
   - Add a virtual joystick for movement on mobile devices.
   - Add on-screen buttons for "Fuse" and "Spectator" actions when a touch device is detected.
3. **Contextual UI**: Update instructions to show "Touch & Drag" and "Tap to Fuse" when on mobile.
4. **Responsive Layout Polish**: Ensure the layout adapts better to small screens, possibly using a drawer for the sidebar or optimizing the stacking order.
