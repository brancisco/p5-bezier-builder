import BezierShape from './BezierShape'
import {
    NumUnk,
    BuildMode,
    InteractionState,
    Boundary,
    Vertices,
    Vertex,
    KeyPressEvent,
    P5

} from './p5-bezier-builder'

function distance (x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

class BezierShapeBuilder {
    bezier: BezierShape
    vertexSize: number
    showVertices: boolean
    buildMode: BuildMode
    undoStorage: Array<any>
    interacting: number
    state: InteractionState
    currentMouse: { x: number, y: number }
    lastMouse: { x: number, y: number }

    constructor (
        vertexSize: number = 5,
        buildMode: BuildMode = BuildMode.ADD_POINT,
        showVertices: boolean = true)
    {
        /**
         * The size of a drawn vertex
         *
         * @type {number}
         */
        this.vertexSize = vertexSize
        /**
         * The current mode of the builder
         *
         * @type {BuildMode}
         */
        this.buildMode = buildMode
        /**
         * Whether or not to draw the vertices
         *
         * @type {boolean}
         */
        this.showVertices = showVertices
        /**
         * An instance of BezierShape to draw and manipulate
         *
         * @type {BezierShape}
         */
        this.bezier = new BezierShape()
        /**
         * Stores representations of deleted vertices and added vertices
         *
         * @type {Array<any>}
         */
        this.undoStorage = []
        /**
         * The index of the vertex being interacted with
         *
         * @type {number}
         */
        this.interacting = -1
        /**
         * The state the builder is currently in
         *
         * @type {InteractionState}
         */
        this.state = InteractionState.Neutral
        /**
         * The position of the mouse currently
         *
         * @type {{x: number, y: number}}
         */
        this.currentMouse = { x: 0, y: 0 }
        /**
         * The position the mouse was in last
         *
         * @type {{x: number, y: number}}
         */
        this.lastMouse = { x: 0, y: 0 }
    }

    /**
     * Get the rectangular boundary of beziershape in form of [top, right, bottom, left]
     * 
     * @returns {Boundary}
     */
    getRectangularBoundary (): Boundary {
        return this.bezier.getRectangularBoundary()
    }

    /**
     * Get the index of the vertex being interacted with, or -1 if none
     * 
     * @returns {number}
     */
    getInteracting (): number {
        return this.interacting
    }

    /**
     * Get the dimensions of the bezier
     * 
     * @returns {[NumUnk, NumUnk]}
     */
    getDim (): [NumUnk, NumUnk] {
        return this.bezier.getDim()
    }

    /**
     * Set the vertices of the bezier. Replaces any vertices already set.
     *
     * @param {Vertices} vertices - The vertices to set the bezier with
     */
    setVertices (vertices: Vertices): void {
        this.bezier.setVertices(vertices)
    }

    /**
     * Remove all vertices from the bezier
     */
    clearVertices (): void {
        this.bezier.setVertices()
    }

    /**
     * Sets the mode of the builder. Allows builder to add points,
     * edit points, move shape, or do nothing
     * 
     * @param {BuildMode} mode - The mode of the builder
     */
    setMode (mode: BuildMode): void {
        this.buildMode = mode
    }

    /**
     * Sets the show vertices prop
     * 
     * @param {boolean} show - Whether or not to draw the vertices
     */
    setShowVertices (show: boolean = true): void {
        this.showVertices = show
    }

    /**
     * Scales the bezier shape by a factor of the number passed in
     *
     * @param {number} scale - The number to scale by
     */
    scale (scale: number = 1): void {
        this.bezier.scale(scale)
    }

    /**
     * Shifts the bezier shape (all vertices) by some x and y
     * 
     * @param {number} x - How much to shift in x direction
     * @param {number} y - How much to shift in y direction
     */
    shift (x: number, y: number): void {
        this.bezier.shift(x, y)
    }

    /**
     * Handles events based on a topic
     * 
     * @param {string} topic - The topic to be handled
     * @param {any} event - The payload (event)
     */
    handleEvent (topic: string, event: any): void {
        switch (topic) {
            case 'mousePressed':
                this.press()
                break
            case 'mouseReleased':
                this.release()
                break
            case 'mouseClicked':
                this.click()
                break
            case 'keyPressed':
                this.keyPress(event)
                break
        }
    }

    /**
     * Handles a click on the canvas
     */
    click (): void {
        if (this.buildMode === BuildMode.ADD_POINT) {
            this.bezier.push(this.currentMouse.x, this.currentMouse.y)
            this.state = InteractionState.Neutral
            this.getHoverIndex()
            this.undoStorage.push([])
        }
    }

    /**
     * Handles a press on the canvas
     */
    press (): void {
        const hovering = this.getHoverIndex()
        this.state = InteractionState.Drag
        if (this.buildMode === BuildMode.EDIT_POINT && hovering >= 0) {
            this.interacting = hovering
        }
    }

    /**
     * Handles a release on the canvas
     */
    release (): void {
        if (this.buildMode === BuildMode.EDIT_POINT && this.state === InteractionState.Drag) {
            this.bezier.setVertex(this.interacting, this.currentMouse.x, this.currentMouse.y)
        }
        else if (this.buildMode === BuildMode.MOVE && this.state == InteractionState.Drag) {
            this.shift(this.currentMouse.x - this.lastMouse.x, this.currentMouse.y - this.lastMouse.y)
        }

        this.interacting = -1
        this.state = InteractionState.Neutral
    }

    /**
     * Handles a keypress on the canvas
     */
    keyPress (event: KeyPressEvent): void {
        const keyCode = event.keyCode
        const hovering = this.getHoverIndex()
        if (hovering >= 0 && keyCode === 8) {
            this.undoStorage.push(this.bezier.splice(hovering))
        }
    }

    /**
     * Handles how to undo an action.
     * Either adds or removes vertices based on the next item in undoStorage stack
     */
    undo (): void {
        if (this.undoStorage.length < 1) return;
        const next = (this.undoStorage.pop() as Vertices)
        if (next.length === 0) {
            this.bezier.pop()
        } else {
            this.bezier.concat(next)
        }
    }

    /**
     * Updates a dragged point
     */
    updateDraggedPoint (): void {
        if (this.buildMode === BuildMode.EDIT_POINT &&
            this.state === InteractionState.Drag &&
            this.interacting >= 0) {
            this.bezier.setVertex(this.interacting, this.currentMouse.x, this.currentMouse.y)
        }
    }

    /**
     * Handles a dragged shape
     */
    updateDraggedCurve (): void {
        if (this.buildMode === BuildMode.MOVE && this.state === InteractionState.Drag) {
            this.shift(this.currentMouse.x - this.lastMouse.x, this.currentMouse.y - this.lastMouse.y)
        }
    }

    /**
     * Gets the hover index based on the distance to the vertex, or -1 if none being hovered
     *
     * NOTE: This might be unnecessary to check for distance. The distance is much
     * more expensive to compute than just checking the boundary.
     *
     * @return {number} - The index of the vertex being hovered over
     */
    getHoverIndex (): number {
        return this.bezier.vertices.findIndex((vertex: Vertex) => {
            return distance(this.currentMouse.x, this.currentMouse.y, vertex[0], vertex[1]) < this.vertexSize
        })
    }

    /**
     * Update the the builder
     */
    update (p5: P5): void {
        this.currentMouse = { x: p5.mouseX, y: p5.mouseY}
        this.updateDraggedPoint()
        this.updateDraggedCurve()
        this.lastMouse = { x: p5.mouseX, y: p5.mouseY }
    }

    /**
     * Draw only the bezier
     */
    drawBezier (p5: P5): void {
        this.bezier.draw(p5)
    }

    /**
     * Draw only the vertices
     */
    drawVertices (p5: P5): void {
        const nVertices = this.bezier.getNVertices()
        if (this.showVertices) {
            for (let i = 0; i < nVertices; i ++) {
                let vertex = (this.bezier.getVertex(i) as [number, number])
                // this next line is expensive to compute
                // const hovering = this.getHoverIndex()
                // if (hovering === i) {
                //     p5.fill(0, 255, 0)
                // }
                if (i % 3) {
                    p5.fill(255, 0, 0)
                } else {
                    p5.fill(255)
                }
                p5.stroke(0)
                p5.ellipse(vertex[0], vertex[1], this.vertexSize, this.vertexSize)
            }
        }
    }

    /**
     * Draw the vertex guide only
     */
    drawVertexGuide (p5: P5): void {
        const nVertices = this.bezier.getNVertices()
        let v1, v2
        for (let i = 1; i < nVertices; i ++) {
            v1 = this.bezier.getVertex(i - 1) as [number, number]
            v2 = this.bezier.getVertex(i) as [number, number]
            p5.line(v1[0], v1[1], v2[0], v2[1])
        }
    }

    /**
     * Draw the bezier and the vertices.
     *
     * NOTE: Drawing these things individually is more expensive. When we
     * draw each part (P) individually, we have to iterate O(P*N).
     * Might be more efficient to have a function that does all the actions
     * in one swoop
     */
    draw (p5: P5): void {
        this.drawBezier(p5)
        this.drawVertices(p5)
    }
}

export default BezierShapeBuilder