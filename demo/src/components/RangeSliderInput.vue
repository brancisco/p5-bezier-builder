<template>
    <div class="slider-wrap" ref="slider_wrap">
        <p v-if="type === 'default'" class="slider-label" :style="sliderLabelStyle">
            <span ref="slider_value">{{value}}</span>
        </p>
        <input
            class="slider"
            :class="{ off: isOff, switch: type === 'switch' }"
            type="range" :min="srange[0]" :max="srange[1]"
            :value="value"
            @input="type === 'default' && $emit('input', parseFloat($event.target.value))"
            @click="type === 'switch' && $emit('input', value === 1 ? 0 : 1)"
        >
    </div>
</template>

<script>
    export default {
        name: "RangeSliderInput",
        components: {

        },
        props: {
            range: {
                type: Array,
                validator (arr) {
                    return arr.length === 2 && arr.every(v => typeof v === 'number')
                },
                default: () => [0, 1]
            },
            type: {
                type: String,
                validator: (v) => ['switch', 'default'].includes(v),
                default: () => 'default'
            },
            value: {
                type: Number
            }
        },
        data () {
            return {
                width: 0
            } 
        },
        computed: {
            isOff () {
                return this.type === 'switch' && this.value === 0
            },
            sliderLabelStyle () {
                // offset is thumb width + slider_value width 
                const sv = this.$refs.slider_value ? this.$refs.slider_value.offsetWidth : 0
                const offset = 14 + sv/2
                const inc = (this.width - offset)/this.range[1]
                let x = -(this.width - offset)/2
                x += inc * this.value
                return {
                    transform: `translate(${x}px, 2px)`
                }
            },
            srange () {
                if (this.type === 'switch') return [0, 1]
                return this.range
            }
        },
        methods: {
            updateSliderWrapWidth () {
                this.width = this.$refs.slider_wrap.offsetWidth
            }
        },
        mounted () {
            if (this.type === 'default') this.$refs.slider_wrap.onresize = this.updateSliderWrapWidth()
        }
    }
</script>

<style scoped>
/* The slider itself */
.slider {
  -webkit-appearance: none;  /* Override default CSS styles */
  appearance: none;
  width: 100%; /* Full-width */
  height: 3px; /* Specified height */
  margin: 0;
  background: #efefef;
  outline: none; /* Remove outline */
}

.slider.switch {
    border-radius: 50px;
    padding: 2px;
    width: 35px;
    height: 20px;
    background: #79e079; /* green */
}

.slider.switch.off {
    background: #eaeaea; /* gray */
}

.slider.switch::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
    background: white !important;
}

.slider.switch::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: white !important;
}

/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  width: 14px;
  height: 14px;
  background: rgb(37, 116, 169);
  cursor: pointer;
  border-radius: 50%;
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: rgb(37, 116, 169); 
  cursor: pointer;
  border-radius: 50%;
}

.slider-label {
    font-family: monospace;
    font-size: 11px;
    margin: 0;  
    text-align: center;
}

</style>