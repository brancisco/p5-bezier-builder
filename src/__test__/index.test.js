import main from '../index'

test('sample test to make sure things are set up', () => {
    expect(main.greet()).toBe('hi')
})