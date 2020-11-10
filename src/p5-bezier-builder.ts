export type NumUnk = number | undefined
export type Boundary = [NumUnk, NumUnk, NumUnk, NumUnk]
export type Vertex = [number, number]
export type Vertices = Array<Vertex>

export enum BuildMode {
    NONE,
    ADD_POINT,
    EDIT_POINT,
    MOVE
}

export enum InteractionState {
    Neutral,
    Hover,
    Drag,
}

export interface KeyPressEvent {
    keyCode: number
}

export declare type P5 = any 