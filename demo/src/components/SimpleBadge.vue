<template>
    <span class="simple-badge">{{text}}</span>
</template>

<script>
    export default {
        name: "SimpleBadge",
        props: {
            text: String | Number
        },
    }
</script>

<style scoped>
    .simple-badge {
        text-align: center;
        background: #2574a9;
        color: white;
        border-radius: 10px;
        min-width: 20px;
        padding: 1px 8px;
        display: inline-block;
        font-size: 0.8rem;
    }
</style>