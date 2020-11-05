type NumUnk = number | undefined
type Boundary = [NumUnk, NumUnk, NumUnk, NumUnk]
type Vertex = [number, number]
type Vertices = Array<Vertex>

class BezierShape {
    vertices: Vertices
    rect: Boundary

    constructor (vertices: Vertices = []) {
        this.vertices = vertices
        this.rect = this.computeRectangle()
    }

    setPosition (x: number, y: number): void {
        if (this.rect.includes(undefined)) return
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        const shiftX = x - l
        const shiftY = y - b
        this.applyToVertices(vertex => [vertex[0] + shiftX, vertex[1] + shiftY])
        this.rect = [t + shiftY, r + shiftX, b + shiftY, l + shiftX]
    }

    setDim (w: number, h: number | null = null): void {
        if (this.rect.includes(undefined)) return
        if (h === null) h = w
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        const width = Math.abs(r - l)
        const scaleW = w/width
        const height = Math.abs(b - t)
        const scaleH = h/height
        // TODO: verify that y: should be "b + h/2", I think it should be "t + h/2"
        const center = { x: l + w/2, y: b + h/2 }

        this.applyToVertices(vertex => {
            return [
                scaleW * (vertex[0] - center.x) + center.x,
                scaleH * (vertex[1] - center.y) + center.y
            ]
        })
        this.setPosition(l, b)
        // top is the bottom - height and right is left + width
        this.rect = [b - h, l + w, b, l]
    }

    getDim (): [NumUnk, NumUnk] {
        if (this.rect.includes(undefined)) return [undefined, undefined]
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        return [Math.abs(r - l), Math.abs(b - t)]
    }

    setVertices (vertices: Vertices = []): void {
        this.vertices = vertices
        this.rect = this.computeRectangle()
    }

    getVertex (i: number): [number, number] | null {
        if (i >= this.vertices.length) return null
        return this.vertices[i]
    }

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

    _evaluateBezierComponent (component: [number, number, number, number], t: number): number {
        // A (1-t)^3 +3 B t (1-t)^2 + 3 C t^2 (1-t) + D t^3
        const c = component
        const ev = c[0] * Math.pow(1 - t, 3) +
            3 * c[1] * t * Math.pow(1 - t, 2) +
            3 * c[2] * Math.pow(t, 2) * (1 - t) +
            c[3] * Math.pow(t, 3)
        return ev
    }

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

    push (x: number, y: number): void {
        this.vertices.push([x, y])
        this.rect = this.computeRectangle()
    }

    setVertex (i: number, x: number, y: number): boolean {
        if (i >= this.vertices.length) return false
        this.vertices[i] = [x, y]
        this.rect = this.computeRectangle()
        return true
    }

    pop (): Vertex | undefined {
        const vertex = this.vertices.pop()
        this.rect = this.computeRectangle()
        return vertex
    }

    concat (vertices: Vertices): void {
        this.vertices = this.vertices.concat(vertices)
        this.rect = this.computeRectangle()
    }

    splice (start: number, deleteCount: number, replace: Vertices): Vertices {
        const removed = this.vertices.splice(start, deleteCount, ...replace)
        this.rect = this.computeRectangle()
        return removed
    }

    insert (start: number, vertices: Vertices): void {
        this.splice(start, 0, vertices)
        this.rect = this.computeRectangle()
    }

    applyToVertices (f: (v: Vertex) => Vertex): void {
        for (let i = 0; i < this.vertices.length; i ++) {
            this.vertices[i] = f(this.vertices[i])
        }
    }

    shift (x: number, y: number = 0): void {
        if (this.rect.includes(undefined)) return
        const [t, r, b, l] = (this.rect as [number, number, number, number])
        this.applyToVertices(vertex => {
            return [vertex[0] + x, vertex[1] + y]
        })
        this.rect = [t + y, r + x, b + y, l + x]
    }

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

    getVertices (): Vertices {
        return this.vertices
    }

    getNCurves (): number {
        return Math.max(0, Math.floor((this.vertices.length - 1) / 3))
    }

    getNVertices (): number {
        return this.vertices.length
    }

    getBezier (i: number): [Vertex, Vertex, Vertex, Vertex] {
        const idx = i * 3
        return (this.vertices.slice(idx, idx + 4) as [Vertex, Vertex, Vertex, Vertex])
    }

    getAnchors (i: number): [Vertex, Vertex] {
        const bezier = this.getBezier(i)
        return [bezier[0], bezier[3]]
        
    }

    getControls (i: number): [Vertex, Vertex] {
        const bezier = this.getBezier(i)
        return [bezier[1], bezier[2]]
    }

    draw (p5: any): void {
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