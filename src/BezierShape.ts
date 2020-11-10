import {
    NumUnk,
    Boundary,
    Vertices,
    Vertex,
    P5

} from './p5-bezier-builder'

class BezierShape {
    vertices: Vertices
    rect: Boundary

    constructor (vertices: Vertices = []) {
        /**
         * The vertices that make up the bezier shape.
         *
         * @type {Vertices}
         */
        this.vertices = vertices

        /**
         * The boundary of the bezier shape. 
         * The format of this variable is [top, right, bottom, left]
         *
         * @type {Boundary}
         */
        this.rect = this.computeRectangle()
    }

    /**
     * Set the position of the bezier shape
     *
     * @param {number} x - The x position of the bezier
     * @param {number} y - The y position of the bezier
     */
    setPosition (x: number, y: number): void {
        // if we haven't computed a rect yet, we can't set the position
        if (this.rect.includes(undefined)) return
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        const shiftX = x - l
        const shiftY = y - b
        this.applyToVertices(vertex => [vertex[0] + shiftX, vertex[1] + shiftY])
        this.rect = [t + shiftY, r + shiftX, b + shiftY, l + shiftX]
    }

    /**
     * Set the dimensions of the bezier
     * 
     * @param {number} w - The width of the bezier
     * @param {number|null} [h=null] - The height of the bezier
     */
    setDim (w: number, h: number | null = null): void {
        if (this.rect.includes(undefined)) return
        if (h === null) h = w
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        const width = Math.abs(r - l)
        const scaleW = w/width
        const height = Math.abs(b - t)
        const scaleH = h/height
        const center = { x: l + w/2, y: t + h/2 }

        this.applyToVertices(vertex => {
            return [
                scaleW * (vertex[0] - center.x) + center.x,
                scaleH * (vertex[1] - center.y) + center.y
            ]
        })
        this.rect = this.computeRectangle()
        this.setPosition(l, b)
    }

    /**
     * Get the dimensions of the bezier
     *
     * @returns {[NumUnk, NumUnk]} - The dimension of the bezier
     */
    getDim (): [NumUnk, NumUnk] {
        if (this.rect.includes(undefined)) return [undefined, undefined]
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        return [Math.abs(r - l), Math.abs(b - t)]
    }

    /**
     * Set the vertices of the bezier
     *
     * @param {Vertices} [vertices=[]] - The vertices the bezier shape will draw
     */
    setVertices (vertices: Vertices = []): void {
        this.vertices = vertices
        this.rect = this.computeRectangle()
    }

    /**
     * Get the ith vertex
     *
     * @param {number} i - the index of the vertex in vertices
     * @returns {Vertex|null}
     */
    getVertex (i: number): [number, number] | null {
        if (i >= this.vertices.length) return null
        return this.vertices[i]
    }

    getRectangularBoundary (): Boundary {
        return [...this.rect]
    }

    /**
     * Compute and get the boundary of the bezier shape.
     *
     * NOTE: this could be sped up by saving the minima/maxima
     * keep an array where each bezier in verticies would have a corresponding boundary
     * when adding a new bezier, check only the new minima/maxima with the this.rect
     * when removing a bezier, only recompute min max search on the array of boundaries
     * downside would be more space, approx 2n space
     *
     * @return {Boundary}
     */
     computeRectangle (): Boundary {
        const nCurves = this.getNCurves()
        if (nCurves < 1) return [undefined, undefined, undefined, undefined]
        // prospects are whate points to look at for minima & maxima
        let xProspects: Array<number> = []
        let yProspects: Array<number> = []
        for(let i = 0; i < nCurves; i ++) {
            // get the ith bezier
            const b = this.getBezier(i)
            // seperate into x & y components
            const xComponent: [number, number, number, number] = [b[0][0], b[1][0], b[2][0], b[3][0]]
            const yComponent: [number, number, number, number] = [b[0][1], b[1][1], b[2][1], b[3][1]]
            // calculate the roots for each component
            // and evaluate the bezier for each root found
            const xRoots = this._findRoots(xComponent).map(r => this._evaluateBezierComponent(xComponent, r))
            const yRoots = this._findRoots(yComponent).map(r => this._evaluateBezierComponent(yComponent, r))
            // add the roots and the end points to prospects
            xProspects = xProspects.concat([...xRoots, b[0][0], b[3][0]])
            yProspects = yProspects.concat([...yRoots, b[0][1], b[3][1]])
        }
        // calculate the boundary by finding min and max of each components prospects
        const boundary: Boundary = [
            Math.min(...yProspects),
            Math.max(...xProspects),
            Math.max(...yProspects),
            Math.min(...xProspects)
        ]
        return boundary
    }

    /**
     * Evaluate either x or y component of a single bezier curve
     *
     * @param {[number, number, number, number]} component - The x or y component to evaluate
     * @param {number} t - The point at which to evaluate the component
     *
     * @returns {number}
     */
    _evaluateBezierComponent (component: [number, number, number, number], t: number): number {
        // A (1-t)^3 +3 B t (1-t)^2 + 3 C t^2 (1-t) + D t^3
        const c = component
        const ev = c[0] * Math.pow(1 - t, 3) +
            3 * c[1] * t * Math.pow(1 - t, 2) +
            3 * c[2] * Math.pow(t, 2) * (1 - t) +
            c[3] * Math.pow(t, 3)
        return ev
    }
    /**
     * Find the roots of a bezier component
     *
     * @param {[number, number, number, number]} bezierComponent - The x or y component to find the roots of
     *
     * @returns {Array<number>}
     */
    _findRoots (bezierComponent: [number, number, number, number]): Array<number> {
        const [p1, p2, p3, p4] = bezierComponent
        const a = 3 * (-p1 + 3*p2 - 3*p3 + p4)
        const b = 6 * (p1 - 2*p2 + p3)
        const c = 3 * (p2 - p1)
        // use the quadratic formula to calculate roots
        const term = Math.pow(b, 2) - 4*a*c
        // no roots if term to take sqrt of is negative
        if (term < 0) {
            return []
        }
        const termSqrt = Math.sqrt(term)
        // filter roots not in interval from [0 => 1] (bezier interval)
        return [(-b + termSqrt)/(2*a), (-b - termSqrt)/(2*a)].filter(r => r >= 0 && r <= 1)
    }

    /**
     * Add a vertex to the vertices
     *
     * @param {number} x - The x position of new vertex
     * @param {number} y - The y position of new vertex
     */
    push (x: number, y: number): void {
        this.vertices.push([x, y])
        this.rect = this.computeRectangle()
    }

    /**
     * Set (update) a specific vertex
     *
     * @param {number} i - The ith vertex to set
     * @param {number} x - The x position
     * @param {number} y - The y position
     *
     * @returns {boolean} - Whether or not the vertex was update
     */
    setVertex (i: number, x: number, y: number): boolean {
        if (i >= this.vertices.length) return false
        this.vertices[i] = [x, y]
        this.rect = this.computeRectangle()
        return true
    }

    /**
     * Remove (and get) a vertex from vertices
     *
     * @returns {Vertex|undefined}
     */
    pop (): Vertex | undefined {
        const vertex = this.vertices.pop()
        this.rect = this.computeRectangle()
        return vertex
    }

    /**
     * Add multiple vertices to the bezier vertices
     *
     * @param {Vertices} vertices - The vertices to add to the shape
     */
    concat (vertices: Vertices): void {
        this.vertices = this.vertices.concat(vertices)
        this.rect = this.computeRectangle()
    }

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
    splice (start: number, deleteCount?: number, replace?: Vertices): Vertices {
        let removed: Vertices
        if (deleteCount === undefined) {
            removed = this.vertices.splice(start)
        } else if (replace === undefined) {
            removed = this.vertices.splice(start, deleteCount)
        } else {
            removed = this.vertices.splice(start, deleteCount, ...replace)
        }
        this.rect = this.computeRectangle()
        return removed
    }

    /**
     * Insert vertices into the bezier vertices.
     * Same as splice(start, 0, vertices)
     *
     * @param {number} start - The zero-based index to insert at
     * @param {Vertices} vertices - The vertices to insert
     */
    insert (start: number, vertices: Vertices): void {
        this.splice(start, 0, vertices)
        this.rect = this.computeRectangle()
    }

    /**
     * Applies a function f to all vertices v
     *
     * @param {(v: Vertex) => Vertex} f - The function to apply to the vertices
     */
    applyToVertices (f: (v: Vertex) => Vertex): void {
        for (let i = 0; i < this.vertices.length; i ++) {
            this.vertices[i] = f(this.vertices[i])
        }
    }

    /**
     * Shifts all vertices by the amount provided in x, and y direction
     *
     * @param {number} x - The number to shift in x direction
     * @param {number} [y=0] - The number to shift in the y direction
     */
    shift (x: number, y: number = 0): void {
        if (this.rect.includes(undefined)) return
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        this.applyToVertices(vertex => {
            return [vertex[0] + x, vertex[1] + y]
        })
        this.rect = [t + y, r + x, b + y, l + x]
    }

    /**
     * Scales the bezier shape by a factor of the number provied
     *
     * @param {number} scale - The number to scale the bezier shape by
     */
    scale (scale: number): void {
        if (this.rect.includes(undefined)) return
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        const w = Math.abs(r - l)
        const h = Math.abs(t - b)
        const center = { x: l + w/2, y: t + h/2 }
        
        this.applyToVertices(vertex => {
            return [
                scale * (vertex[0] - center.x) + center.x,
                scale * (vertex[1] - center.y) + center.y
            ]
        })
        // TODO: test if we can just calculate the rect using arithmatic instead of
        // compute rectangle here
        this.rect = this.computeRectangle()
    }

    /**
     * Returns the vertices of the bezier shape
     * @returns {Vertices}
     */
    getVertices (): Vertices {
        return this.vertices
    }

    /**
     * Returns the number of individual bezier curves which make up the shape.
     * Does not include any incomplete bezier curves in the count.
     *
     * @return {number}
     */
    getNCurves (): number {
        return Math.max(0, Math.floor((this.vertices.length - 1) / 3))
    }

    /**
     * Returns the number of vertices stored
     *
     * @returns {number}
     */
    getNVertices (): number {
        return this.vertices.length
    }

    /**
     * Returns the ith bezier curve
     *
     * @param {number} i - The index of the bezier curve to get
     * @returns {[Vertex, Vertex, Vertex, Vertex]}
     */
    getBezier (i: number): [Vertex, Vertex, Vertex, Vertex] {
        const idx = i * 3
        return (this.vertices.slice(idx, idx + 4) as [Vertex, Vertex, Vertex, Vertex])
    }

    /**
     * Returns the end points of the ith bezier curve, i.e., [start_point, end_point]
     *
     * @param {number} i - The index of the bezier curve
     * @returns {[Vertex, Vertex]}
     */
    getAnchors (i: number): [Vertex, Vertex] {
        const bezier = this.getBezier(i)
        return [bezier[0], bezier[3]]
        
    }

    /**
     * Returns the control points of the ith bezier curve, i.e., [control_point1, control_point2]
     *
     * @param {number} i - The index of the bezier curve
     * @return {[Vertex, Vertex]}
     */
    getControls (i: number): [Vertex, Vertex] {
        const bezier = this.getBezier(i)
        return [bezier[1], bezier[2]]
    }

    /**
     * Draws the bezier shape using the p5 object
     *
     * @param {P5} p5 - The p5 object
     */
    draw (p5: P5): void {
        const nCurves = this.getNCurves()
        if (this.vertices.length > 0) {
            p5.beginShape()
            p5.vertex(this.vertices[0][0], this.vertices[0][1])
            for (let i = 0; i < nCurves; i ++) {
                const [, c1, c2, a2] = this.getBezier(i)
                p5.bezierVertex(c1[0], c1[1], c2[0], c2[1], a2[0], a2[1])
            }
            p5.endShape()
        }
    }
}

export default BezierShape