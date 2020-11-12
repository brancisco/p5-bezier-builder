# p5-bezier-builder
A small library and tool to build complex bezier shapes for p5 sketches

## Getting Started

### Installing

```
npm i @brancisco/p5-bezier-builder
```

### Drawing a bezier shape

In your p5 sketch to draw beziers use the `BezierShape` class

```js
import { BezierShape } from '@brancisco/p5-bezier-builder'

const sketch = function (p) {
    let myshape;
    p.setup = function setup (p5) {
        const myshape = new BezierShape([
            [0, 0], [10, 10], [20, 20], [30, 30] // [, nth vertex]
        ]);
    };

    p.draw = function draw (p5) {
        p5.background(255)
        p5.fill(0)
        myshape.draw(p5)
    };
};
```

### Helper to create bezier shapes

- Use the demo

1. Visit: https://brancisco.github.io/p5-bezier-builder/
2. Draw your shape (or shapes)
3. Click the export button in the demo
4. Move the file into your project
5. (Optional for ease): make the file a .js file and write `export default () => [/* ... exported beziers here */]`
6. Import the file into your sketch. e.g.,  `import mybezierdata from "./path/to/my/BezierSketch.js"`
7. Use the BezierShape class to draw your bezier in your sketch


```js
import { BezierShape } from '@brancisco/p5-bezier-builder'
import mybezierdata from './path/to/my/BezierSketch.js'

const sketch = function (p) {
    let myshape;
    p.setup = function setup (p5) {
        const myshape = new BezierShape(mybezierdata());
        myshape.setPosition(100, 100) // sets the position at x: 100, y: 100
        myshape.setDim(50, 50) // changes the dimensions of your shape to w: 50, h: 50
    };

    p.draw = function draw (p5) {
        p5.background(255)
        p5.fill(0)
        myshape.draw(p5)
    };
};
```

OR create your own tool:

- To create a bezier shape use the `BezierShapeBuilder` helper class.

```js
import { BezierShapeBuilder } from '@brancisco/p5-bezier-builder'

const sketch = function (p) {
    let builder;
    p.setup = function setup (p5) {
        const builder = new BezierShape();
    };

    p.draw = function draw (p5) {
        p5.background(255);
        p5.fill(0);
        builder.update(p5);
        builder.draw(p5);
    };

    p5.mousePressed = (event) => {
        builder.handleEvent('mousePressed', event);
    };

    p5.mouseClicked = (event) => {
        builder.handleEvent('mouseClicked', event);
    };

    p5.mouseReleased = (event) => {
        builder.handleEvent('mouseReleased', event);
    };

    p5.keyPressed = (event) => {
        builder.handleEvent('keyPressed', event);
    };
};
```

## BezierShape Methods

### Transformations

#### shift()

```ts
/**
 * Shifts all vertices by the amount provided in x, and y direction
 *
 * @param {number} x - The number to shift in x direction
 * @param {number} [y=0] - The number to shift in the y direction
 */
shift (x: number, y: number = 0): void;
```

#### setPosition()

```ts
/**
 * Set the position of the bezier shape
 *
 * @param {number} x - The x position of the bezier
 * @param {number} y - The y position of the bezier
 */
setPosition (x: number, y: number): void;
```

#### setDim()

```ts
/**
 * Set the dimensions of the bezier
 * 
 * @param {number} w - The width of the bezier
 * @param {number|null} [h=null] - The height of the bezier
 */
setDim (w: number, h: number | null = null): void;
```

#### scale()

```ts
/**
 * Scales the bezier shape by a factor of the number provied
 *
 * @param {number} scale - The number to scale the bezier shape by
 */
scale (scale: number): void;
```

#### applyToVertices()

Note: Currently if you use this function, the rectangular boundary is not recomputed. You must manually
assign the `rect` property to the return value of `computeRectangle()`. For Example:

```js
// square the verts
myshape.applyToVertices(v => [v[0]**v[0], v[1]**v[1]])
myshape.rect = myshape.computeRectangle()
```

```ts
/**
 * Applies a function f to all vertices v
 *
 * @param {(v: Vertex) => Vertex} f - The function to apply to the vertices
 */
applyToVertices (f: (v: Vertex) => Vertex): void
```

### Getters

#### getDim()

```ts
/**
 * Get the dimensions of the bezier
 *
 * @returns {[NumUnk, NumUnk]} - The dimension of the bezier
 */
getDim (): [NumUnk, NumUnk];
```

#### getRectangularBoundary()

```ts
/**
 * Get the rectangular boundary of the bezier
 *
 * @returns {Boundary} - In the form of [top, right, bottom, left]
 */
getRectangularBoundary (): Boundary;
```

#### getBezier()

```ts
/**
 * Returns the ith bezier curve
 *
 * @param {number} i - The index of the bezier curve to get
 * @returns {[Vertex, Vertex, Vertex, Vertex]}
 */
getBezier (i: number): [Vertex, Vertex, Vertex, Vertex];
```

### Vertex / Shape Manipulation

#### push()

```ts
/**
 * Add a vertex to the vertices
 *
 * @param {number} x - The x position of new vertex
 * @param {number} y - The y position of new vertex
 */
push (x: number, y: number): void;
```

#### pop()

```ts
/**
 * Remove (and get) a vertex from vertices
 *
 * @returns {Vertex|undefined}
 */
pop (): Vertex | undefined;
```

#### concat()

```ts
/**
 * Add multiple vertices to the bezier vertices
 *
 * @param {Vertices} vertices - The vertices to add to the shape
 */
concat (vertices: Vertices): void;
```

#### splice()

```ts
/**
 * Removes vertices from the bezier vertices, and if necessary replaces vertices with new ones,
 * returning the removed elements
 *
 * @param {number} start - The zero-based index to start removing vertices from
 * @param {number|undefined} deleteCount - The number of vertices to remove
 * @param {Vertices|undefined} replace - The vertices to replace the removed
 *
 * @returns {Vertices}
 */
splice (start: number, deleteCount?: number, replace?: Vertices): Vertices;
```

#### insert()

```ts
/**
 * Insert vertices into the bezier vertices.
 * Same as splice(start, 0, vertices)
 *
 * @param {number} start - The zero-based index to insert at
 * @param {Vertices} vertices - The vertices to insert
 */
insert (start: number, vertices: Vertices): void
```


## Todo

- Write tests
- Make demo mobile friendly
- Add demo functionality to save shapes to local storage
- Add demo functionality to remove curves from any index withing bezier shape
- Add demo functionality to insert points into a bezer shape