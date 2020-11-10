<template>
    <div id="app">
        <bezier-builder/>
    </div>
</template>

<script>
    import BezierBuilder from './BezierBuilder'

    export default {
        components: {
            BezierBuilder
        }
    }
</script>

<style>
    html, body {
        padding: 0;
        margin: 0;
    }
    #app {
        font-family: 'Helvetica Neue'
    }
</style>