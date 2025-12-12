# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **3D Room visualization** project built with Three.js, creating an interactive WebGL experience of a 3D room environment. The project features multiple interactive 3D objects including Google LEDs, Loupedeck buttons, coffee steam effects, and more.

## Quick Start

### Development
```bash
npm run dev
```
Runs webpack-dev-server on port 8080 with live reload and opens the browser automatically.

### Production Build
```bash
npm run build
```
Creates optimized production build in `dist/` directory with minified assets.

## Architecture

### Core Structure

**Entry Point**: `src/script.js`
- Initializes the Experience class with a target DOM element

**Main Class**: `src/Experience/Experience.js`
- Singleton pattern (`Experience.instance`)
- Orchestrates all systems: Time, Sizes, Scene, Camera, Renderer, Resources, World, Navigation
- Handles resize events and rendering loop

**Key Modules**:

1. **World** (`src/Experience/World.js`)
   - Contains all 3D objects and scene setup
   - Manages: Baked, GoogleLeds, LoupedeckButtons, CoffeeSteam, TopChair, ElgatoLight, BouncingLogo, Screen

2. **Camera** (`src/Experience/Camera.js`)
   - Perspective camera setup and controls

3. **Renderer** (`src/Experience/Renderer.js`)
   - WebGL renderer configuration with anti-aliasing and tone mapping

4. **Resources** (`src/Experience/Resources.js`)
   - Manages asset loading (GLB models, textures, shaders)
   - Uses event emitter pattern for loading state notifications

5. **Navigation** (`src/Experience/Navigation.js`)
   - Handles user controls and camera movement

6. **Utils** (`src/Experience/Utils/`)
   - `Time.js`: Animation loop management
   - `Sizes.js`: Window resize handling with event system
   - `Stats.js`: Performance monitoring
   - `Loader.js`: Progress tracking for resources

### Shaders

Custom GLSL shaders are located in `src/Experience/shaders/`:
- `baked/`: Static baked lighting shaders
- `coffeeSteam/`: Animated steam effect shaders
- `partials/`: Reusable shader components (e.g., Perlin noise)

Shaders are processed through `glslify-loader` for module imports.

### Assets

**Static Assets** (copied to dist during build):
- `static/assets/`: 3D models (GLB), textures, videos
- `static/basis/`: Basis Universal texture compression transcoder
- `static/draco/`: Draco mesh compression decoder
- `static/social/`: Social media preview images

## Development Workflow

### Common Commands

```bash
# Install dependencies (first time only)
npm install

# Development server with hot reload
npm run dev

# Production build
npm run build

# Production deployment (switches to prod branch, merges, and pushes)
npm run prod
```

### Webpack Configuration

**Common Config** (`bundler/webpack.common.js`):
- Entry: `src/script.js`
- Output: `dist/bundle.[contenthash].js`
- Source maps enabled
- CopyWebpackPlugin: copies `static/` directory
- HTML template processing
- CSS extraction
- File loaders for images and fonts
- GLSL shader loading with raw-loader + glslify-loader

**Development** (`bundler/webpack.dev.js`):
- DevServer on port 8080
- Watches content base
- Auto-opens browser
- Displays local IP and localhost URLs

**Production** (`bundler/webpack.prod.js`):
- CleanWebpackPlugin for dist cleanup
- Production optimizations (minification, etc.)

### Key Technologies

- **Three.js** (^0.130.1): 3D graphics library
- **GSAP** (^3.7.1): Animation library
- **Tweakpane** (^3.0.5): Debug UI controls
- **Stats.js**: Performance monitoring
- **Webpack** (^5.42.1): Module bundling
- **Babel** (^7.14.6): JavaScript transpilation
- **glsl-blend** (^1.0.3): Shader utilities

## Project Conventions

### Code Style
- ES6+ modules with `import`/`export`
- Class-based architecture with clear separation of concerns
- Singleton pattern for Experience class
- Event-driven communication between modules

### File Organization
- All 3D object modules follow the pattern: `src/Experience/[ObjectName].js`
- Utilities are in `src/Experience/Utils/`
- Shaders are grouped by feature in `src/Experience/shaders/`
- Static assets are in `static/` (copied during build)

### Resource Loading
Assets are declared in `src/Experience/assets.js` with loading groups
- Resources class emits 'groupEnd' event when a group finishes loading
- World listens for 'base' group completion before initializing objects

## Important Notes

1. **Static Directory**: All files in `static/` are copied to dist during build - use this for any assets that need to be served
2. **Shaders**: Custom shaders require both vertex and fragment files, processed through glslify
3. **Window Resize**: Sizes.js handles resize events and emits to registered listeners
4. **Debug Mode**: Tweakpane provides live UI controls for tweaking parameters
5. **Performance**: Stats.js shows FPS and performance metrics in development
