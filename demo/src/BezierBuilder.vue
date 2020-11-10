<template>
    <div id="bez_builder_wrap">
        <div id="sketch_book"></div>
        <div v-if="showMenu === false" id="sketch_hidden_menu">
            <button @click="toggleMenu"><fa-icon :icon="['fas', 'bars']"/></button>
            <button @click="undo"><fa-icon :icon="['fas', 'undo-alt']"/></button>
        </div>
        <div v-else id="sketch_menu">
            <div class="button-row">
                <button @click="toggleMenu">Hide Menu <fa-icon :icon="['fas', 'bars']"/></button>
                <button @click="undo">Undo <fa-icon :icon="['fas', 'undo-alt']"/></button>
                <button @click="download">Export <fa-icon :icon="['fas', 'file-export']"/></button>
            </div>
            <div class="switch-n-lable">
                <p>Total Shapes: <simple-badge :text="nShapes"/></p>
                <div>
                    <button @click="addShape">Add</button>
                    <button @click="deleteShape">Remove</button>
                </div>
            </div>
            <div class="switch-n-lable">
                <p>Mode: <simple-badge :text="modeDisplay"/></p>
                <div><button @click="toggleMode"><fa-icon :icon="['fas', 'sync-alt']"/></button></div>
            </div>
            <div class="switch-n-lable">
                <p>Current Shape: <simple-badge :text="activeIndex"/></p>
            </div>
            <div class="switch-n-lable">
                <span>Cycle Shape</span>
                <div>
                    <button @click="left"><fa-icon :icon="['fas', 'arrow-left']"/></button>
                    <button @click="right"><fa-icon :icon="['fas', 'arrow-right']"/></button>
                </div>
            </div>
            <div class="switch-n-lable">
                <span>Change Layer z-index</span>
                <div>
                    <button @click="promote"><fa-icon :icon="['fas', 'arrow-up']"/></button>
                    <button @click="demote"><fa-icon :icon="['fas', 'arrow-down']"/></button>
                </div>
            </div>

            <div class="switch-n-lable">
                <label>Cosshair</label>
                <range-slider-input v-model="showCrosshair" type="switch"/>
            </div>
            <div class="switch-n-lable">
                <label>Vertex Guides</label>
                <range-slider-input v-model="showGuides" type="switch"/>
            </div>
            <div class="switch-n-lable">
                <label>Layer Focus</label>
                <range-slider-input v-model="layerFocus" type="switch"/>
            </div>
            <div class="switch-n-lable">
                <label>Show Vertices</label>
                <range-slider-input v-model="showVertices" type="switch"/>
            </div>
            <div class="switch-n-lable">
                <label>Opacity</label>
                <range-slider-input style="width: 200px;" :range="[0, 255]" v-model="opacity"/>
            </div>   
            <div class="switch-n-lable">
                <label>Red</label>
                <range-slider-input style="width: 200px;" :range="[0, 255]" v-model="red"/>
            </div>
            <div class="switch-n-lable">
                <label>Blue</label>
                <range-slider-input style="width: 200px;" :range="[0, 255]" v-model="green"/>
            </div>
            <div class="switch-n-lable">
                <label>Green</label>
                <range-slider-input style="width: 200px;" :range="[0, 255]" v-model="blue"/>
            </div>
            <div>
                <div class="button-row">
                    <input type="file" accept="image/*" @change="uploadImage">
                </div>
                <div class="switch-n-lable">
                    <label>Show Image</label>
                    <range-slider-input  v-model="showImage" type="switch"/>
                </div>
                <div class="switch-n-lable">
                    <label>Resize Image Mode</label>
                    <range-slider-input  v-model="resizeImageMode" type="switch"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    // import libs
    import p5 from 'p5'
    import BezierSketch from './BezierSketch'

    // import components
    import RangeSliderInput from './components/RangeSliderInput'
    import SimpleBadge from './components/SimpleBadge'

    export default {
        name: "BezierBuilder",
        components: {
            RangeSliderInput,
            SimpleBadge
        },
        data () {
            return {
                bezSketch: null,
                showMenu: true,
                dataURL: '',
            } 
        },
        computed: {
            activeIndex () {
                if (this.bezSketch === null) return 0
                return this.bezSketch.active
            },
            modeDisplay () {
                const modes = {
                    1: () => 'Add Vertex',
                    2: () => 'Edit Vertex',
                    3: () => 'Move Shape',
                    0: () => this.resizeImageMode ? 'Resize Image' : 'Resize Shape'
                }
                return this.bezSketch ? modes[this.bezSketch.builderMode]() : 0
            },
            nShapes () {
                if (this.bezSketch === null) return 0
                return this.bezSketch.builders.length
            },
            showCrosshair: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.showCross ? 1 : 0
                },
                set (show) {
                    if (this.bezSketch === null) return
                    this.bezSketch.showCross = !!show
                }
            },
            showVertices: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.showVertices ? 1 : 0
                },
                set (show) {
                    this.bezSketch.setShowVertices(!!show)
                }
            },
            layerFocus: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.getActiveOnly() ? 1 : 0
                },
                set (active) {
                    this.bezSketch.setActiveOnly(!!active)
                }
            },
            opacity: {
                get () {
                    if (this.bezSketch === null) return 255
                    return this.bezSketch.getActiveOpacity()
                },
                set (opacity) {
                    if (this.bezSketch === null) return
                    this.bezSketch.setActiveOpacity(opacity)
                }
            },
            red: {
                get () {
                    if (this.bezSketch === null) return 255
                    return this.bezSketch.getActiveColor()[0]
                },
                set (red) {
                    if (this.bezSketch === null) return
                    this.bezSketch.setActiveColor({ red })
                }
            },
            blue: {
                get () {
                    if (this.bezSketch === null) return 255
                    return this.bezSketch.getActiveColor()[1]
                },
                set (blue) {
                    if (this.bezSketch === null) return
                    this.bezSketch.setActiveColor({ blue })
                }
            },
            green: {
                get () {
                    if (this.bezSketch === null) return 255
                    return this.bezSketch.getActiveColor()[2]
                },
                set (green) {
                    if (this.bezSketch === null) return
                    this.bezSketch.setActiveColor({ green })
                }
            },
            showImage: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.showBackgroundImage ? 1 : 0
                },
                set (show) {
                    if (this.bezSketch === null) return
                    this.bezSketch.showBackgroundImage = !!show
                }
            },
            showGuides: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.showGuides ? 1 : 0
                },
                set (show) {
                    if (this.bezSketch === null) return
                    this.bezSketch.showGuides = !!show
                }
            },
            resizeImageMode: {
                get () {
                    if (this.bezSketch === null) return 0
                    return this.bezSketch.resizeImageMode ? 1 : 0
                },
                set (resize) {
                    if (this.bezSketch === null) return
                    this.bezSketch.toggleResizeImageMode(!!resize)
                }
            }
        },
        methods: {
            toggleMenu () {
                this.showMenu = !this.showMenu
            },
            addShape () {
                this.bezSketch.addShape()
            },
            deleteShape () {
                this.bezSketch.deleteActiveShape()
            },
            left () {
                this.bezSketch.left()
            },
            right () {
                this.bezSketch.right()
            },
            toggleMode () {
                if (this.resizeImageMode) return
                this.bezSketch.setMode((this.bezSketch.builderMode + 1) % 4)
            },
            undo () {
                this.bezSketch.undo()
            },
            promote () {
                this.bezSketch.promoteLayer()
            },
            demote () {
                this.bezSketch.demoteLayer()
            },
            uploadImage (event) {
                const file = event.target.files[0]
                const reader = new FileReader()
                reader.onloadend = () => {
                    this.bezSketch.uploadImage(reader.result)
                }
                reader.readAsDataURL(file)
            },
            download() {
                if (this.bezSketch === null) return
                let arr = []
                for (let builder of this.bezSketch.builders) {
                    arr.push(builder.bezier.getVertices())
                }
                const data = JSON.stringify(arr)
                var element = document.createElement('a');
                element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
                element.setAttribute('download', 'BezierSketch');

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            }
        },
        mounted () {
            this.bezSketch = new BezierSketch('sketch_canvas', true)
            const sketch = this.bezSketch.sketch.bind(this.bezSketch)
            new p5 (sketch, 'sketch_book')
        }
    }
</script>

<style scoped>
    
    .title {
        color: blue;
    }

    #bez_builder_wrap {
        position: relative;
    }

    #sketch_book {
        width: 100%;
        text-align: center;
    }

    #sketch_canvas {
        display: inline;
    }

    #sketch_hidden_menu {
        position: absolute;
        left: 0;
        top: 0;
        padding: 15px;
    }

    #sketch_menu {
        width: 300px;
        position: absolute;
        left: 0;
        top: 0;
        background: #222222;
        color: white;
        padding: 15px;
        border-bottom-right-radius: 10px;
    }

    button {
        cursor: pointer;
    }

    .switch-n-lable {
        display: flex;
        justify-content: space-between;
        align-items: flex-end; 
        margin-bottom: 5px;
        height: 30px;
        padding: 3px 0 5px 0;
    }

    .switch-n-lable > p {
        margin: 0;
    }

    .button-row {
        margin-bottom: 7px;
    }

</style>