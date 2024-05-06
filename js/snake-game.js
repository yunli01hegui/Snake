/**
 * A Snake Game Enhanced
 * Author: Billy Tao
 * Date: 2021/06/6
 */


// 计时器
class Timer {
    constructor() {
        this.reset()
    }
    reset() {
        this.now = Date.now();
        this.last = Date.now();
        this.passedFrames = 0;
        this.elapsed = 0;
    }
    update() {
        this.now = Date.now();
        this.passedFrames = (this.now - this.last) / (1000 / 60) // 60帧每秒计，过了几帧时间
        this.elapsed += this.now - this.last // 消逝时间累计(特效用)
        this.last = this.now;
    }
}

// 用于记录、读取矩阵内的方格状态
class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.tiles = [];
        for (let r = 0; r < rows; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < cols; c++) {
                this.tiles[r][c] = '';
            }
        }
    }
    // 取某个单元格的值
    get(r, c) {
        return this.tiles[r][c];
    }
    // 设置某个单元格的值
    set(r, c, val) {
        this.tiles[r][c] = val
    }
}

// 方块基类
class Tile {
    constructor(opt) {
        this.parent = opt.parent; // 自己的父对象
        this.collection = opt.collection; // 自己所在容器（数组）
        this.col = opt.col;  // 列
        this.row = opt.row; // 行
        this.x = opt.x; // 坐标：x
        this.y = opt.y; // 坐标：y
        this.w = opt.w; // 宽
        this.h = opt.h; // 高
    }
}

// 面板方块
class BoardTile extends Tile {
    constructor(opt) {
        super(opt)
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.el.className = 'tile';
        this.parent.boardEl.appendChild(this.el);
        // 方块可能具有的 CSS 类
        this.classes = {
            passed: 0, // 蛇游过的方块的 CSS 类
            path: 0, // 指示食物路径的方块的 CSS 类
            up: 0, // 向上路径方块的 CSS 类
            down: 0, // 向下路径方块的 CSS 类
            left: 0, // 向左路径方块的 CSS 类
            right: 0 // 向右路径方块的 CSS 类
        }
    }
    update() {
        for (let k in this.classes) {
            if (this.classes.hasOwnProperty(k) && this.classes[k]) {
                this.classes[k]--; // 对每一个CSS类取消1次（只有蛇经过的方格的CSS类passed计数会超过1，留痕效果）
            }
        }
        // 确定方格相应的 CSS 类
        if (this.parent.food.tile.col === this.col || this.parent.food.tile.row === this.row) {
            this.classes.path = 1; // .path，属于引导到食物的路径上的方块
            if (this.col < this.parent.food.tile.col) {
                this.classes.right = 1; // .right，路径上的右箭头方块
            } else {
                this.classes.right = 0;
            }
            if (this.col > this.parent.food.tile.col) {
                this.classes.left = 1; // .left，路径上的左箭头方块
            } else {
                this.classes.left = 0;
            }
            if (this.row > this.parent.food.tile.row) {
                this.classes.up = 1; // .up，路径上的上箭头方块
            } else {
                this.classes.up = 0;
            }
            if (this.row < this.parent.food.tile.row) {
                this.classes.down = 1; // .down，路径上的下箭头方块
            } else {
                this.classes.down = 0;
            }
        } else {
            this.classes.path = 0;
        }
        // 食物已经被吃，取消方格的 CSS .path 类
        if (this.parent.food.eaten) {
            this.classes.path = 0;
        }
        this.render()
    }
    render() {
        this.el.className = 'tile'
        // 加载各种 CSS 类（类计数大于等于1）
        for (let k in this.classes) {
            if (this.classes.hasOwnProperty(k) && this.classes[k]) {
                this.el.classList.add(k)
            }
        }
        Object.assign(this.el.style, {
            left: `${this.x}px`,
            top: `${this.y}px`,
            width: `${this.w}px`,
            height: `${this.h}px`
        })
    }
}

// 蛇方块
class SnakeTile extends Tile {
    constructor(opt) {
        super(opt)
        this.scale = 1;
        this.blur = 0;
        this.alpha = 1;
        this.borderRadius = '10%';
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.parent.boardEl.appendChild(this.el);
    }
    update(i) {
        this.x = this.col * this.parent.tileWidth;
        this.y = this.row * this.parent.tileHeight;
        // 蛇头
        if (i === 0) {
            // 蛇头加止正弦规律的模糊变化
            this.blur = this.parent.boardWidth * 0.03 + Math.sin(this.parent.timer.elapsed / 200) * this.parent.boardWidth * 0.015;
        }
        // 蛇身
        else {
            this.blur = 0;
        }
        // alpha 值随位置调整（越往后越小）
        this.alpha = 1 - (i / this.parent.snake.tiles.length) * 0.6;
    }
    render() {
        this.el.style.left = this.x + 'px';
        this.el.style.top = this.y + 'px';
        this.el.style.width = this.w + 'px';
        this.el.style.height = this.h + 'px';
        this.el.style.backgroundColor = 'rgba(255, 255, 255, ' + this.alpha + ')';
        this.el.style.boxShadow = '0 0 ' + this.blur + 'px #fff';
        this.el.style.borderRadius = this.borderRadius;
    }
}

// 食物方块
class FoodTile extends Tile {
    constructor(opt) {
        super(opt)
        this.blur = 0;
        this.scale = 1;
        this.hue = 100;
        this.opacity = 0;
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.parent.boardEl.appendChild(this.el);
    }
    update() {
        this.x = this.col * this.parent.tileWidth;
        this.y = this.row * this.parent.tileHeight;
        // 加个正弦函数变化规律的模糊，Math.sin()的最大值是1，最小值是0
        this.blur = this.parent.boardWidth * 0.03 + Math.sin(this.parent.timer.elapsed / 200) * this.parent.boardWidth * 0.015;
        // 加个正弦函数变化规律的缩放，Math.sin()的最大值是1，最小值是0
        this.scale = 0.8 + Math.sin(this.parent.timer.elapsed / 200) * 0.2;
        this.opacity = 1;
        this.render()
    }
    render() {
        Object.assign(this.el.style, {
            left: this.x + 'px',
            top: this.y + 'px',
            width: this.w + 'px',
            height: this.h + 'px',
            borderRadius: "10%",
            transform: 'scale(' + this.scale + ')',
            backgroundColor: 'hsla(' + this.hue + ', 100%, 60%, 1)',
            boxShadow: '0 0 ' + this.blur + 'px hsla(' + this.hue + ', 100%, 60%, 1)',
            opacity: this.opacity
        })
    }
}

// 蛇
class Snake {
    constructor(opt) {
        this.parent = opt.parent
        this.dir = 'right'
        this.currentDir = this.dir
        // 所有方块： SnakeTile 对象数组
        this.tiles = []
        let row = g.util.randInt(0, this.parent.grid.rows - 1)
        let col = g.util.randInt(4, this.parent.grid.cols - 1)
        for (let i = 0; i < 5; i++) {
            this.tiles.push(new SnakeTile({
                parent: this.parent,
                collection: this.tiles,
                col: col - i,
                row,            
                x: (col - i) * opt.parent.tileWidth,
                y: row * opt.parent.tileHeight,
                w: opt.parent.tileWidth - opt.parent.spacing,
                h: opt.parent.tileHeight - opt.parent.spacing
            }));
        }
        this.last = 0
        this.passedFrames = 0
        this.updateFrameCount = 10
        this.death = false

        // 数据反映到矩阵
        let i = this.tiles.length
        while (i--) {
            this.parent.grid.set(this.tiles[i].row, this.tiles[i].col, 'snake');
        }
    }
    update() {
        if (this.parent.keys.up) {
            if (this.dir !== 'down' && this.currentDir !== 'down') {
                this.dir = 'up'
            }
        } else if (this.parent.keys.down) {
            if (this.dir !== 'up' && this.currentDir !== 'up') {
                this.dir = 'down'
            }
        } else if (this.parent.keys.right) {
            if (this.dir !== 'left' && this.currentDir !== 'left') {
                this.dir = 'right'
            }
        } else if (this.parent.keys.left) {
            if (this.dir !== 'right' && this.currentDir !== 'right') {
                this.dir = 'left'
            }
        } else if (this.parent.keys.fast) {
            if (this.updateFrameCount > 1) {
                this.updateFrameCount -= 1
                document.querySelector('.speed').textContent = g.util.round(2 - this.updateFrameCount / 10, 1) + 'X';
            }
        } else if (this.parent.keys.slow) {
            if (this.updateFrameCount < 19) {
                this.updateFrameCount += 1
                document.querySelector('.speed').textContent = g.util.round(2 - this.updateFrameCount / 10, 1) + 'X';
            }
        }
        else if (this.parent.keys.normal) {
            this.updateFrameCount = 10
            document.querySelector('.speed').textContent = g.util.round(2 - this.updateFrameCount / 10, 1) + 'X';
        }

        this.currentDir = this.dir
        Object.assign(this.parent.keys, { up: 0, down: 0, right: 0, left: 0, slow: 0, fast: 0, normal: 0 })
        // 累加帧数
        this.passedFrames += this.parent.timer.passedFrames;
        // 更新时机（达到更新的等待帧数）
        if (this.passedFrames >= this.updateFrameCount) {
            // 重设计帧起点
            this.passedFrames = 0
            // 头部压入，暂时用原先的头部的坐标数据
            this.tiles.unshift(new SnakeTile({
                parent: this.parent,
                collection: this.tiles,
                col: this.tiles[0].col,
                row: this.tiles[0].row,
                x: this.tiles[0].col * this.parent.tileWidth,
                y: this.tiles[0].row * this.parent.tileHeight,
                w: this.parent.tileWidth - this.parent.spacing,
                h: this.parent.tileHeight - this.parent.spacing
            }));
            // 尾部弹出
            this.last = this.tiles.pop();
            this.parent.boardEl.removeChild(this.last.el); // 移走对应 dom 元素
            this.parent.grid.set(this.last.row, this.last.col, '');
            // 留痕（两个周期：2->1->0，最后 3000ms 淡出，见 css）
            this.parent.boardTiles[this.last.col + (this.last.row * this.parent.cols)].classes.passed = 2;

            // 设置蛇身方格标志（排除蛇头）
            let i = this.tiles.length;
            while (i--) {
                this.parent.grid.set(this.tiles[i].row, this.tiles[i].col, 'snake');
            }
            // 现在更改蛇头位置
            if (this.dir === 'up') {
                this.tiles[0].row -= 1;
            } else if (this.dir === 'down') {
                this.tiles[0].row += 1;
            } else if (this.dir === 'left') {
                this.tiles[0].col -= 1;
            } else if (this.dir === 'right') {
                this.tiles[0].col += 1;
            }

            // 碰墙
            if (this.tiles[0].col >= this.parent.cols) {
                this.tiles[0].col = 0;
            }
            if (this.tiles[0].col < 0) {
                this.tiles[0].col = this.parent.cols - 1;
            }
            if (this.tiles[0].row >= this.parent.rows) {
                this.tiles[0].row = 0;
            }
            if (this.tiles[0].row < 0) {
                this.tiles[0].row = this.parent.rows - 1;
            }

            // 碰到蛇身
            if (this.parent.grid.get(this.tiles[0].row, this.tiles[0].col) === 'snake') {
                this.death = true;
            }

            // 吃到食物
            if (this.parent.grid.get(this.tiles[0].row, this.tiles[0].col) === 'food') {
                this.parent.sounds['eatting.wav'].play()
                this.tiles.push(new SnakeTile({
                    parent: this.parent,
                    collection: this.tiles,
                    col: this.last.col,
                    row: this.last.row,
                    x: this.last.col * this.parent.tileWidth,
                    y: this.last.row * this.parent.tileHeight,
                    w: this.parent.tileWidth - this.parent.spacing,
                    h: this.parent.tileHeight - this.parent.spacing
                }));
                this.parent.score++;
                this.parent.scoreEl.innerHTML = this.parent.score;

                this.parent.food.eaten = 1;
                this.parent.boardEl.removeChild(this.parent.food.tile.el);

                // 推迟一定时间再创建新食物，给人一种食物被吃掉了的明确感觉（我个人感觉，也可不推迟）
                setTimeout(() => {
                    this.parent.food = new Food({
                        parent: this.parent
                    });
                }, 300);
            }

            // 结束
            if (this.death) {
                this.parent.state='game_over'
                document.querySelector(".tip div").textContent = "GAME OVER"
                document.querySelector(".tip").style.display = "block"
                cancelAnimationFrame(handle)
                this.parent.sounds['background1.mp3'].pause()
                return
            }

            // 更新蛇方块
            i = this.tiles.length;
            while (i--) {
                this.tiles[i].update(i);
            }
        }
        this.render()
    }
    render() {
        let i = this.tiles.length;
        while (i--) {
            this.tiles[i].render(i);
        }
    }
}

// 食物
class Food {
    constructor(opt) {
        this.parent = opt.parent // game 对象
        // 只有一个方块
        this.tile = new FoodTile({
            parent: this.parent,
            col: 0,
            row: 0,
            x: 0,
            y: 0,
            w: opt.parent.tileWidth - opt.parent.spacing,
            h: opt.parent.tileHeight - opt.parent.spacing
        });
        this.init();
        // 被吃标志
        this.eaten = 0;
    }
    init() {
        let empty = []; // “空”格数组
        // 收集“空”格
        for (let r = 0; r < this.parent.rows; r++) {
            for (let c = 0; c < this.parent.cols; c++) {
                let tile = this.parent.grid.get(r, c);
                if (tile === '') {
                    empty.push({ r, c });
                }
            }
        }
        // 在随机的一个“空”格中生成食物
        const newTile = empty[g.util.randInt(0, empty.length - 1)];
        this.tile.row = newTile.r;
        this.tile.col = newTile.c;
    }
    update() {
        this.tile.update();
        this.parent.grid.set(this.tile.row, this.tile.col, 'food');
        this.render()
    }
    render() {
        this.tile.render()
    }
}

class Game {
    constructor() {
        this.ready = false
        this.state = "init"
        this.sounds = {}
        this.sounds_loaded = 0
    }
    init() {
        this.scoreEl = document.querySelector('.score');
        this.boardEl = document.querySelector('.board');
        this.cols = 30;
        this.rows = 20;
        this.margin = 0.25; // 25%
        this.boardTiles = [];
        this.keys = {};
        this.score = 0;
        this.timer = new Timer();
        this.spacing = 2;
        this.grid = new Grid(this.rows, this.cols);
        // 设定方格大小
        this.tileHeight = this.tileWidth = 30
        // 设定面板大小
        this.boardWidth = (this.tileWidth ) * this.cols
        this.boardHeight = (this.tileHeight ) * this.rows
        this.createBoardTiles();
        this.bindEvents();
        this.snake = new Snake({
            parent: this
        });
        this.food = new Food({
            parent: this
        });
        this.render()
    }
    createBoardTiles() {
        this.boardEl.innerHTML=""
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.boardTiles.push(new BoardTile({
                    parent: this,
                    collection: this.boardTiles,
                    col: x,
                    row: y,
                    x: x * this.tileWidth,
                    y: y * this.tileHeight,
                    w: this.tileWidth - this.spacing,
                    h: this.tileHeight - this.spacing
                }));
            }
        }
        this.boardTiles.forEach(t => t.render());
    }
    keydown(e) {

        e.preventDefault();

        // 因为此函数要同时作为监听执行函数，this 在监听执行时可能绑定到其它对象
        // 在此明确针对的对象就是 game
        let _this = game
        if (e.key.indexOf('Arrow') !== -1) {
            _this.keys[e.key.replace('Arrow', '').toLowerCase()] = 1
        }

        if (e.key === "-") {
            _this.keys['slow'] = 1
        }
        if (e.key === "=") {
            _this.keys['fast'] = 1
        }
        if (e.key === "0") {
            _this.keys['normal'] = 1
        }

        if (e.key === " ") {
            _this.keys['spacebar'] = 1
        }

    }
    bindEvents() {
        window.addEventListener('keydown', this.keydown, false);
    }
    render() {
        this.boardEl.style.height = this.boardHeight + 'px';
        this.boardEl.style.width = this.boardWidth + 'px';
        this.scoreEl.innerHTML = this.score;
    }
    step() {
        //console.log(this.state,this.keys.spacebar)
        if (!this.keys.spacebar) {
            if (this.state === 'running') {
                document.querySelector(".tip").style.display = "none"
                this.sounds['background1.mp3'].play()
                this.boardTiles.forEach(t => t.update());
                this.snake.update();
                this.food.update();
                this.timer.update()
            }
            else if (this.state === 'paused') {
                document.querySelector(".tip div").textContent = "PAUSED"
                document.querySelector(".tip").style.display = "block"
                this.sounds['background1.mp3'].pause()
            }
        }
        else {
            if(this.state==='game_over'){
                this.createBoardTiles()
                this.state='init'
            }
            if (this.state === 'init') {
                this.state = 'running'
            }
            else if (this.state === 'running') { 
                this.state = 'paused'
                //this.keys = 
            }
            else if (this.state === 'paused') {
                Object.assign(this.keys, { up: 0, down: 0, right: 0, left: 0, slow: 0, fast: 0, normal: 0 })  
                this.state = 'running'
            }
            this.keys.spacebar = 0
        }

    }
    start(){
        document.querySelector(".tip div").textContent = "START"
        this.init()
        let _this = this
        function go() {
            handle = requestAnimationFrame(go)
            _this.step()
        }
        go()
    }
}

const g = {
    util: {
        rand(min, max) {
            return Math.random() * (max - min) + min
        },
        randInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min
        },
        round(num, pre) {
            return Math.round(+num + 'e' + pre) / Math.pow(10, pre)
        }

    },
    config: {
        title: 'Snake Game',
        debug: window.location.hash === '#debug' ? 1 : 0,
    }
}

const game = new Game()
let sound_names = ['background1.mp3', 'eatting.wav']

let handle;

for (let sound_name of sound_names) {
    let sound = new Audio();
    if (sound_name == "background1.mp3") {
        sound.loop = true;
    }
    sound.addEventListener("canplaythrough", function (e) {
        game.sounds[sound_name] = sound;
        game.sounds_loaded++;
        if (game.sounds_loaded == sound_names.length) {
            game.sounds["background1.mp3"].ontimeupdate = function (i) {
                console.log(this.currentTime)
                if ((this.currentTime >= 15.50) ) {
                    this.currentTime = 0;
                    this.play();
                }
            };
            game.start()
        }
    });
    sound.src = `sound/${sound_name}`;
}



