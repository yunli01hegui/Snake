let $=el=>document.querySelector(el);
let value={};
class Timer{
    constructor() {
        this.now=Date.now();
        this.last=Date.now();
        this.passedFrames=0;
        this.elapsed=0;
    }
    update(){
        this.now=Date.now();
        this.passedFrames=(this.now-this.last)/(1000/60);
        this.elapsed+=this.now-this.last;
        this.last=this.now;
    }
}
class Grid{
    constructor(rows,cols) {
        this.rows=rows;
        this.cols=cols;
        this.grid=[];
        for (let r=0;r<this.rows;r++){
            this.grid[r]=[];
            for (let c=0;c<this.cols;c++){
                this.grid[r][c]='';
            }
        }
    }
    get(r,c){
        return this.grid[r][c];
    }
    set(r,c,value){
        this.grid[r][c]=value;
    }
}
class Tile{
    constructor(opt) {
        this.parent=opt.parent;
        this.collection=opt.collection;
        this.width=opt.width;
        this.height=opt.height;
        this.row=opt.row;
        this.col=opt.col;
        this.x=opt.x;
        this.y=opt.y;
    }
}
class BoxTile extends Tile{
    constructor(opt) {
        super(opt);
        this.el=document.createElement('div');
        this.el.className='tile';
        this.parent.boxEl.appendChild(this.el);
        this.classes={
            up:0,
            down:0,
            left:0,
            right:0,
            path:0,
            passed:0
        }
    }
    update(){
        for (let k in this.classes){
            if (this.classes.hasOwnProperty(k) && this.classes[k]){
                this.classes[k]--;
            }
        }
        if (this.col===this.parent.food.food.col || this.row===this.parent.food.food.row){
            this.classes.path=1;
            if (this.col>this.parent.food.food.col){
                this.classes.left=1;
            }else {
                this.classes.left=0;
            }
            if (this.col<this.parent.food.food.col){
                this.classes.right=1;
            }else {
                this.classes.right=0;
            }
            if (this.row>this.parent.food.food.row){
                this.classes.up=1;
            }else {
                this.classes.up=0;
            }
            if (this.row<this.parent.food.food.row){
                this.classes.down=1;
            }else {
                this.classes.down=0;
            }
        }else {
            this.classes.path=0;
        }
        if (this.parent.food.eaten){
            this.classes.path=0;
        }
        this.render();
    }
    render(){
        this.el.className='tile';
        for (let k in  this.classes){
            if (this.classes.hasOwnProperty(k) && this.classes[k]){
                this.el.classList.add(k);
            }
        }
        Object.assign(this.el.style,{
            left:this.x+'px',
            top: this.y+'px',
            width: this.width+'px',
            height: this.height+'px'
        })
    }
}
class FoodTile extends Tile{
    constructor(opt) {
        super(opt);
        this.hue=100;
        this.blur=1;
        this.scale=1;
        this.el=document.createElement('div');
        this.el.style.position='absolute';
        this.parent.boxEl.appendChild(this.el);
    }
    update(){
        this.blur=this.parent.boxWidth*0.03+Math.sin(this.parent.timer.elapsed/200)*this.parent.boxWidth*0.015;
        this.scale=1-0.2*Math.sin(this.parent.timer.elapsed/200);
        this.x=this.col*this.parent.tileWidth;
        this.y=this.row*this.parent.tileHeight;
        this.render();
    }
    render(){
        Object.assign(this.el.style,{
            left: this.x+'px',
            top: this.y+'px',
            width:this.width+'px',
            height: this.height+'px',
            backgroundColor: `hsla(${this.hue},100%,60%,1)`,
            boxShadow: `0 0 ${this.blur}px hsla(${this.hue},100%,60%,1)`,
            transform:`scale(${this.scale})`,
            borderRadius: '10%',
        })
    }
}
class Food{
    constructor(opt) {
        this.parent=opt.parent;
        this.eaten=0;
        this.food=new FoodTile({
            parent: this.parent,
            collection: this.food,
            width: this.parent.tileWidth-this.parent.spacing,
            height:this.parent.tileHeight-this.parent.spacing,
            row: 0,
            col: 0,
            x:0,
            y:0
        });
        this.init();
    }
    init(){
        let empty=[];
        for (let r=0;r<this.parent.rows;r++){
            for (let c=0;c<this.parent.cols;c++){
                let tile=this.parent.grid.get(r,c);
                if (tile===''){
                    empty.push({r,c});
                }
            }
        }
        let newTile=empty[g.randInt(0,empty.length-1)];
        this.food.row=newTile.r;
        this.food.col=newTile.c;
    }
    update(){
        this.food.update();
        this.parent.grid.set(this.food.row,this.food.col,'food');
    }
}
class SnakeTile extends Tile{
    constructor(opt) {
        super(opt);
        this.opacity=1;
        this.blur=1;
        this.el=document.createElement('div');
        this.el.style.position='absolute';
        this.parent.boxEl.appendChild(this.el);
    }
    update(i){
        this.x=this.col*this.parent.tileWidth;
        this.y=this.row*this.parent.tileHeight;
        if (i===0){
            this.blur=this.parent.boxWidth*0.03+Math.sin(this.parent.timer.elapsed/200)*this.parent.boxWidth*0.015;
        }else {
            this.blur=0;
        }
        this.opacity=1-(i/this.parent.snake.snake.length)*0.6;
        this.render();
    }
    render(){
        Object.assign(this.el.style,{
            left: this.x+'px',
            top: this.y+'px',
            width: this.width+'px',
            height: this.height+'px',
            backgroundColor: 'white',
            opacity:this.opacity,
            borderRadius: '10%',
            boxShadow: `0 0 ${this.blur}px white`,
        })
    }
}
class Snake{
    constructor(opt) {
        this.parent=opt.parent;
        this.dirs=['right','left','up','down'];
        this.dir=this.dirs[g.randInt(0,this.dirs.length-1)];
        this.currentDir=this.dir;
        this.death=0;
        this.last=0;
        this.passedFrames=0;
        this.updateFrames=10;
        if (this.dir==='left'){
            this.row=g.randInt(0,this.parent.rows-1);
            this.col=g.randInt(0,(this.parent.cols-1)-4);
            this.snake=[];
            for (let i=0;i<5;i++){
                this.snake.push(new SnakeTile({
                    parent: this.parent,
                    collection: this.snake,
                    width:this.parent.tileWidth-this.parent.spacing,
                    height:this.parent.tileHeight-this.parent.spacing,
                    row:this.row,
                    col:this.col+i,
                    x: (this.col+i)*this.parent.tileWidth,
                    y: this.row*this.parent.tileHeight,
                }))
            }
        }
        if (this.dir==='right'){
            this.row=g.randInt(0,this.parent.rows-1);
            this.col=g.randInt(4,this.parent.cols-1);
            this.snake=[];
            for (let i=0;i<5;i++){
                this.snake.push(new SnakeTile({
                    parent: this.parent,
                    collection: this.snake,
                    width:this.parent.tileWidth-this.parent.spacing,
                    height:this.parent.tileHeight-this.parent.spacing,
                    row:this.row,
                    col:this.col-i,
                    x: (this.col-i)*this.parent.tileWidth,
                    y: this.row*this.parent.tileHeight,
                }))
            }
        }
        if (this.dir==='down'){
            this.row=g.randInt(4,(this.parent.rows-1));
            this.col=g.randInt(0,this.parent.cols-1);
            this.snake=[];
            for (let i=0;i<5;i++){
                this.snake.push(new SnakeTile({
                    parent: this.parent,
                    collection: this.snake,
                    width:this.parent.tileWidth-this.parent.spacing,
                    height:this.parent.tileHeight-this.parent.spacing,
                    row:this.row-i,
                    col:this.col,
                    x: this.col*this.parent.tileWidth,
                    y: (this.row-i)*this.parent.tileHeight,
                }))
            }
        }
        if (this.dir==='up'){
            this.row=g.randInt(0,(this.parent.rows-1)-4);
            this.col=g.randInt(0,this.parent.cols-1);
            this.snake=[];
            for (let i=0;i<5;i++){
                this.snake.push(new SnakeTile({
                    parent: this.parent,
                    collection: this.snake,
                    width:this.parent.tileWidth-this.parent.spacing,
                    height:this.parent.tileHeight-this.parent.spacing,
                    row:this.row+i,
                    col:this.col,
                    x: this.col*this.parent.tileWidth,
                    y: (this.row+i)*this.parent.tileHeight,
                }))
            }
        }
    }
    update(){
        $('.speed').textContent=g.randRound(2-this.updateFrames/10,1)+'X';
        if (this.parent.keys.up){
            if (this.currentDir!=='down' && this.dir!=='down'){
                this.dir='up';
            }
        }
        if (this.parent.keys.down){
            if (this.currentDir!=='up' && this.dir!=='up'){
                this.dir='down';
            }
        }
        if (this.parent.keys.left){
            if (this.currentDir!=='right' && this.dir!=='right'){
                this.dir='left';
            }
        }
        if (this.parent.keys.right){
            if (this.currentDir!=='left' && this.dir!=='left'){
                this.dir='right';
            }
        }
        if (this.parent.keys.slow){
            if (this.updateFrames<19){
                this.updateFrames+=1;
            }
        }
        if (this.parent.keys.fast){
            if (this.updateFrames>1){
                this.updateFrames-=1;
            }
        }
        if (this.parent.keys.normal){
            this.updateFrames=10;
        }
        this.currentDir=this.dir;
        this.passedFrames+=this.parent.timer.passedFrames;
        Object.assign(this.parent.keys,{up:0,down:0,left:0,right:0,normal:0,fast:0,slow:0});
        if (this.passedFrames>=this.updateFrames){
            this.passedFrames=0;
            this.snake.unshift(new SnakeTile({
                parent: this.parent,
                collection: this.snake,
                width:this.snake[0].width,
                height:this.snake[0].height,
                row: this.snake[0].row,
                col:this.snake[0].col,
                x:this.snake[0].x,
                y:this.snake[0].y
            }));
            this.last=this.snake.pop();
            this.parent.boxEl.removeChild(this.last.el);
            this.parent.grid.set(this.last.row,this.last.col,'');
            let i=this.snake.length;
            while (i--){
                this.parent.grid.set(this.snake[i].row,this.snake[i].col,'snake');
            }
            this.parent.tiles[this.last.col+this.last.row*this.parent.cols].classes.passed=2;
            if (this.dir==='left'){
                this.snake[0].col-=1;
            }else if (this.dir==='right'){
                this.snake[0].col+=1;
            }else if (this.dir==='up'){
                this.snake[0].row-=1;
            }else if (this.dir==='down'){
                this.snake[0].row+=1;
            }
            if (this.snake[0].col>=this.parent.cols){
                this.snake[0].col=0;
            }
            if (this.snake[0].col<0){
                this.snake[0].col=this.parent.cols-1;
            }
            if (this.snake[0].row>=this.parent.rows){
                this.snake[0].row=0;
            }
            if (this.snake[0].row<0){
                this.snake[0].row=this.parent.rows-1;
            }
            if (this.parent.grid.get(this.snake[0].row,this.snake[0].col)==='food'){
                this.parent.sounds['eatting.wav'].play();
                this.parent.score++;
                this.parent.scoreEl.textContent=this.parent.score;
                this.snake.unshift(new SnakeTile({
                    parent: this.parent,
                    collection: this.snake,
                    width:this.snake[0].width,
                    height:this.snake[0].height,
                    row: this.snake[0].row,
                    col:this.snake[0].col,
                    x:this.snake[0].x,
                    y:this.snake[0].y
                }));
                this.parent.boxEl.removeChild(this.parent.food.food.el);
                this.parent.grid.set(this.snake[0].row,this.snake[0].col,'');
                setTimeout(()=>{
                    this.parent.food=new Food({
                        parent: this.parent
                    })
                },300)
            }
            if (this.parent.grid.get(this.snake[0].row,this.snake[0].col)==='snake'){
                this.death=1;
            }
            if (this.death){
                cancelAnimationFrame(handle);
                this.parent.sounds['background1.mp3'].pause();
                this.parent.state='game_over';
                $('.tip').style.display='flex';
                $('.tip_use').style.display='none';
                $('.tip_text').style.display='block';
                $('.tip_text').textContent='game over';
                $('button').style.display='block';
                $('button').textContent='restart the game';
            }
            i=this.snake.length;
            while (i--){
                this.snake[i].update(i);
            }
        }
    }
}
class Game{
    constructor() {
        this.state='init';
        this.sounds={};
        this.sound_loads=0;
    }
    init(){
        this.boxEl=$('.box');
        this.scoreEl=$('.score');
        this.score=0;
        this.tileWidth=this.tileHeight=30;
        this.spacing=2;
        this.rows=20;
        this.cols=30;
        this.boxWidth=this.cols*this.tileWidth;
        this.boxHeight=this.rows*this.tileHeight;
        this.tiles=[];
        this.keys={};
        this.createBoxTiles();
        this.listenKey();
        this.timer=new Timer();
        this.grid=new Grid(this.rows,this.cols);
        this.food=new Food({
            parent: this
        });
        this.snake=new Snake({
            parent: this
        })
        this.render();
    }
    createBoxTiles(){
        this.boxEl.innerHTML='';
        for (let r=0;r<this.rows;r++){
            for (let c=0;c<this.cols;c++){
                this.tiles.push(new BoxTile({
                    parent: this,
                    collection:this.tiles,
                    width:this.tileWidth-this.spacing,
                    height:this.tileHeight-this.spacing,
                    row: r,
                    col:c,
                    x:this.tileWidth*c,
                    y:this.tileHeight*r
                }))
            }
        }
        this.tiles.forEach(t=>t.render());
    }
    render(){
        this.boxEl.style.width=this.boxWidth+'px';
        this.boxEl.style.height=this.boxHeight+'px';
        this.scoreEl.textContent=this.score;
    }
    keydown(e){
        e.preventDefault();
        let _this=game;
        if (e.key.indexOf('Arrow')!==-1){
            _this.keys[e.key.replace('Arrow','').toLowerCase()]=1;
        }
        if (e.key==='0'){
            _this.keys['normal']=1;
        }
        if (e.key==='-'){
            _this.keys['slow']=1;
        }
        if (e.key==='='){
            _this.keys['fast']=1;
        }
        if (e.key===' '){
            _this.keys['spacebar']=1;
        }
    }
    listenKey(){
        document.addEventListener('keydown',this.keydown,false);
    }
    step(){
        if (!this.keys.spacebar){
            if (this.state==='running'){
                $('.tip').style.display='none';
                this.sounds['background1.mp3'].play();
                this.tiles.forEach(t=>t.update());
                this.timer.update();
                this.food.update();
                this.snake.update();
            }else if (this.state==='pause'){
                $('.tip').style.display='flex';
                $('.tip_use').style.display='none';
                $('.tip_text').style.display='block';
                $('.tip_text').textContent='pause';
                $('button').style.display='none';
                this.sounds['background1.mp3'].pause();
            }
        }else {
            if (this.state==='game_over'){
                this.state='init';
            }
            if (this.state==='init'){
                this.state='running';
            }else if (this.state==='running'){
                this.state='pause';
            }else if (this.state==='pause'){
                this.state='running';
                Object.assign(this.keys,{up:0,down:0,left:0,right:0,slow:0,fast:0,normal:0,spacebar:0});
            }
            this.keys.spacebar=0;
        }
    }
    start(){
        this.init();
        $('.tip_text').style.display='none';
        $('button').textContent='start the game';
        let _this=game;
        $('button').addEventListener('click',()=>{
            this.init();
            this.state='running';
            function go(){
                handle=requestAnimationFrame(go);
                _this.step();
            }go();
        })
    }
}
let handle;
let game=new Game();
const g={
    randInt(min,max){
        return Math.floor(Math.random()*(max-min+1))+min;
    },
    randRound(num,pre){
        return Math.round(num+'e'+pre)/Math.pow(10,pre);
    }
}
let sound_names=['background1.mp3','eatting.wav'];
for (let sound_name of sound_names){
    let sound=new Audio();
    sound.src=`./sound/${sound_name}`;
    sound.addEventListener('canplaythrough',()=>{
        game.sound_loads++;
        game.sounds[sound_name]=sound;
        if (game.sound_loads===sound_names.length){
            game.sounds['background1.mp3'].ontimeupdate=()=>{
                if (this.currentTime>=15.5){
                    this.currentTime=0;
                    this.play();
                }
            }
            game.start();
        }
    })
}