<template>
    <div v-masonry class="image-container" transition-duration="0" item-selector=".item" :origin-top="true"
        :horizontal-order="false" :fit-width="true" gutter="20">
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="700" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="200" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="600" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="440" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="200" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="500" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="800"></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="50" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="500" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="500" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="700" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="200" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="500" v-masonry-tile></v-skeleton-loader>
        </v-card>
        <v-card v-masonry-tile class="item" @click="" flat>
            <v-skeleton-loader type="image" height="300"></v-skeleton-loader>
        </v-card>
    </div>
</template>

<style lang="scss" scoped>
.item {
    width: 600;
}

.skeleton-image-1 {
    height: 700px;
    width: 600px;
}

.skeleton-image-2 {
    height: 300px;
    width: 600px;
}

.skeleton-image-3 {
    height: 900px;
    width: 600px;
}

.image-container {
    margin: auto;
    position: relative;
}

::v-deep(.v-skeleton-loader)>* {
    height: 100%;
    display: flex;
    flex-direction: column;
}

::v-deep(.v-skeleton-loader .v-skeleton-loader__bone) {
    flex-grow: 1;
}
</style>