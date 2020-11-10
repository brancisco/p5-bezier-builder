const Origin = {
    0: 'tl',
    1: 'tr',
    2: 'bl',
    3: 'br',
    4: 'c'
}

class BoxResizer {
    constructor (origin = 0, handleRadius = 5) {
        this.on = true
        this.xywh
        this.origin
        this.handleSize
        this.corners
        this.state = 'none'
        this.active = ''
        this.clickOrigin = [null, null]

        this.registeredObject
        this.objGetter

        this.setOrigin(origin)
        this.setHandleRadius(handleRadius)
    }

    /**
     * Toggle whether the resizer should activly resize & be updated
     * @param {boolean|null} status
     */
    toggle (status = null) {
        this.on = status !== null ? status : !this.on
    }

    /**
     * Get the corners of the object being resized
     *
     * @returns {[Vertex, Vertex, Vertex, Vertex]|null}
     */
    get corners () {
        if (this.xywh === null) {
            return null
        }
        const [x, y, w, h] = this.xywh
        // tl, tr, br, bl
        return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
    }

    /**
     * Sets the type of origin an object has
     */
    setOrigin (origin = 0) {
        this.origin = origin
    }

    /**
     * Sets the handle size of the resizer
     */
    setHandleRadius (handleRadius = 5) {
        this.handleRadius = handleRadius
    }

    /**
     * Does a boundary check given parameters.
     * Checks if xp and yp are withing x, y, w, h, origin
     */
    _boundaryCheck (xp, yp, x, y, w, h, origin = 4) {
        if (Origin[origin] === 'c') {
            const [w2, h2] = [w/2, h/2]
            return xp > x - w2 && xp < x + w2 && yp > y - h2 && yp < y + h2
        } else if (Origin[origin] === 'tl') {
            return xp > x && xp < x + w && yp > y && yp < y + h
        } else if (Origin[origin] === 'bl') {
            return xp > x && xp < x + w && yp > y - h && yp < y
        } else {
            throw new Error('BoxResizer::boundaryCheck - Unknown origin option')
        }
    }

    /**
     * Checks if mouse mx, my are within the boundary of the object
     */
    mouseOverBody (mx, my) {
        const [x, y, w, h] = this.xywh
        return this._boundaryCheck(xp, yp, x, y, w, h, this.origin)
    }

    /**
     * Returns whether the mouse mx, my is over a handle
     */
    mouseOverHandle (mx, my) {
        if (this.corners === null) return ''
        const label = ['tl', 'tr', 'br', 'bl']
        let x, y
        for (let i in this.corners) {
            [x, y] = this.corners[i]
            const hd = this.handleRadius*2
            if (this._boundaryCheck(mx, my, x, y, hd, hd)) return label[i]
        }
        return ''
    }

    /**
     * Handles events under a given topic
     */
    handleEvent (topic, event) {
        switch (topic) {
            case 'mousePressed':
                this.mousePressed(event)
                break
            case 'mouseReleased':
                this.mouseReleased(event)
                break
        }
    }

    /**
     * Handles the resizer logic when mouse is pressed
     */
    mousePressed (event) {
        if (!this.on) return
        const [x, y] = [event.offsetX, event.offsetY]
        const moh = this.mouseOverHandle(x, y)
        if (moh !== '') {
            this.state = 'drag'
            this.active = moh
            this.clickOrigin = [x, y]
        }
    }

    /**
     * Handles resizer logic when mouse is released
     */
    mouseReleased (event) {
        if (!this.on) return
        const [x, y] = [event.offsetX, event.offsetY]
        if (this.objResizer !== null && this.state === 'drag') {
            this.objResizer(this.clickOrigin, [x, y], this.active)
        }
        this.state = 'none'
        this.active = ''
        this.clickOrigin = [null, null]
    }

    /**
     * Registers an object with functions to get its boundary, and to resize the object
     *
     * @param {object} obj - The object to resize
     * @param {(obj) => [Vertex, Vertex, Vertex, Vertex]} function to handle getting object x, y, w, h
     * @param {(start, end, corner) => void} f2 - Function to handle resizing the object
     */
    registerObject (obj, f, f2) {
        this.registerObject = obj
        this.objGetter = f
        this.objResizer = f2
    }

    /**
     * Gets the object (to be resized) x, y, w, h
     */
    get xywh () {
        if (this.objGetter && this.registerObject) {
            return this.objGetter(this.registerObject)
        }
        return null
    }

    /**
     * Updates the resizer
     */
    update (p5) {
        if (this.objResizer !== null && this.state === 'drag') {
            this.objResizer(this.clickOrigin, [p5.mouseX, p5.mouseY], this.active)
            this.clickOrigin = [p5.mouseX, p5.mouseY]
        }
    }

    /**
     * Draws the resizer
     */
    draw (p5) {
        if (this.xywh) {
            const [x, y, w, h] = this.xywh
            p5.stroke(0)
            p5.noFill()
            p5.rect(x, y, w, h)
            const r = this.handleRadius
            const r2 = r/2
            const [tl, tr, br, bl] = this.corners
            p5.fill(0)
            p5.rect(tl[0] - r2, tl[1] - r2, r, r)
            p5.rect(tr[0] - r2, tr[1] - r2, r, r)
            p5.rect(br[0] - r2, br[1] - r2, r, r)
            p5.rect(bl[0] - r2, bl[1] - r2, r, r)
        }
    }

}

export default BoxResizer