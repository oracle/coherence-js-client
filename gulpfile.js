
let protobuf = require("gulp-protobuf");

const {
    src,
    dest,
    series
} = require('gulp');

const del = require("del");

function protoGen(cb) {
    return src('src/cache/proto/*.proto')
        .pipe(protobuf.pbjs({
            target: "static-module",
            wrap: "commonjs"
        }))
        .pipe(dest('src/cache/generated'));
}

function protoTs(cb) {
    return src("src/cache/generated/*")
        .pipe(protobuf.pbts({}))
        .pipe(dest("src/cache/generated"));
}

function clean(cb) {
    return del('dist').then(del('src/cache/generated'));
}

// exports.protoGen = protoGen;
// exports.protoTs = protoTs;
exports.clean = clean;

exports.proto = series(protoGen, protoTs);