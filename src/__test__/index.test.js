import { BezierShape, BezierShapeBuilder } from '../index'

test('BezierShape is exported from index', () => {
    const bez = new BezierShape()
    expect(bez).toBeInstanceOf(BezierShape)
})

test('BezierShapeBuilder is exported from index', () => {
    const bezBuilder = new BezierShapeBuilder()
    expect(bezBuilder).toBeInstanceOf(BezierShapeBuilder)
})