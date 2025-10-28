let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let score = 0;
let gameState = 'loading'; // loading, playing, finished
let table;
let buttons = [];
let feedback = '';

// 在全域變數區域加入煙火相關變數
let fireworks = [];
let gravity;

function preload() {
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(1200, 800); // 增加畫布大小
  textAlign(CENTER, CENTER);
  gravity = createVector(0, 0.2);
  
  // 從CSV載入所有題目
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    questions.push({
      question: row.getString('題目'),
      options: [
        row.getString('選項A'),
        row.getString('選項B'),
        row.getString('選項C'),
        row.getString('選項D')
      ],
      correct: row.getString('正確答案')
    });
  }
  
  // 隨機選擇5題
  let shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  selectedQuestions = shuffled.slice(0, 5);
  
  // 建立選項按鈕
  createButtons();
  
  gameState = 'playing';
}

function createButtons() {
  const buttonWidth = 400;
  const buttonHeight = 70;
  const startX = width/2 - buttonWidth/2;
  
  buttons = [];
  let options = ['A', 'B', 'C', 'D'];
  
  for(let i = 0; i < 4; i++) {
    // 將按鈕位置往下調整一些
    let y = 450 + i * 90;
    buttons.push({
      x: startX,
      y: y,
      width: buttonWidth,
      height: buttonHeight,
      label: options[i]
    });
  }
}

function draw() {
  background(50);
  
  if (gameState === 'playing') {
    // 顯示目前題目
    fill(255);
    textSize(36); // 放大文字
    text(`題目 ${currentQuestion + 1}/5`, width/2, 100);
    
    textSize(42); // 放大題目文字
    text(selectedQuestions[currentQuestion].question, width/2, 250);
    
    // 繪製按鈕
    for(let i = 0; i < buttons.length; i++) {
      let b = buttons[i];
      fill(mouseIsOverButton(b) ? color(100) : 70);
      stroke(255);
      rect(b.x, b.y, b.width, b.height, 15); // 圓角按鈕
      fill(255);
      noStroke();
      textSize(32); // 放大選項文字
      text(selectedQuestions[currentQuestion].options[i], b.x + b.width/2, b.y + b.height/2);
    }
  } else if (gameState === 'finished') {
    // 顯示結果
    fill(255);
    textSize(64); // 放大結果文字
    text(`測驗完成！`, width/2, height/3 - 50);
    text(`你的得分是: ${score}/5`, width/2, height/3 + 50);
    
    textSize(48);
    let feedbackText = '';
    if (score === 5) feedbackText = "太棒了！滿分！";
    else if (score >= 3) feedbackText = "做得不錯！";
    else feedbackText = "再加油！";
    
    text(feedbackText, width/2, height/2 + 50);
  }
  
  // 更新並顯示煙火
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
  
  // 顯示回饋
  if (feedback) {
    textSize(42);
    fill(255);
    // 將回饋文字位置調整到選項上方
    text(feedback, width/2, 350);
  }
}

function mousePressed() {
  if (gameState === 'playing') {
    for(let i = 0; i < buttons.length; i++) {
      if (mouseIsOverButton(buttons[i])) {
        checkAnswer(i);
        break;
      }
    }
  }
}

function mouseIsOverButton(b) {
  return mouseX > b.x && mouseX < b.x + b.width && 
         mouseY > b.y && mouseY < b.y + b.height;
}

function checkAnswer(answerIndex) {
  let correct = selectedQuestions[currentQuestion].correct === ['A','B','C','D'][answerIndex];
  
  if (correct) {
    score++;
    feedback = '答對了！';
    // 增加答對時的煙火數量
    for (let i = 0; i < 8; i++) {
      fireworks.push(new Firework());
    }
  } else {
    feedback = '答錯了...';
  }
  
  // 延遲後進入下一題
  setTimeout(() => {
    feedback = '';
    currentQuestion++;
    if (currentQuestion >= 5) {
      gameState = 'finished';
      // 滿分時放更多煙火
      if (score === 5) {
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            fireworks.push(new Firework());
          }, i * 200); // 間隔發射煙火
        }
      }
    }
  }, 1000);
}

// 煙火類別
class Firework {
  constructor() {
    this.pos = createVector(random(width), height);
    this.vel = createVector(0, random(-16, -12)); // 增加上升速度
    this.acc = createVector(0, 0);
    this.color = color(random(255), random(255), random(255));
    this.particles = [];
    this.exploded = false;
    this.size = random(2, 4); // 煙火大小
  }

  done() {
    return this.exploded && this.particles.length === 0;
  }

  update() {
    if (!this.exploded) {
      this.vel.add(gravity);
      this.pos.add(this.vel);
      
      if (this.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  }

  explode() {
    // 增加粒子數量
    for (let i = 0; i < 150; i++) {
      const p = new Particle(
        this.pos.x, 
        this.pos.y, 
        this.color,
        random(1, 3) // 隨機粒子大小
      );
      this.particles.push(p);
    }
    // 產生第二層爆炸
    if (random() > 0.5) {
      for (let i = 0; i < 50; i++) {
        const p = new Particle(
          this.pos.x, 
          this.pos.y, 
          color(random(255), random(255), random(255)),
          random(2, 4)
        );
        p.vel.mult(1.5); // 第二層速度更快
        this.particles.push(p);
      }
    }
  }

  show() {
    if (!this.exploded) {
      stroke(this.color);
      strokeWeight(this.size);
      point(this.pos.x, this.pos.y);
    }
    
    for (let particle of this.particles) {
      particle.show();
    }
  }
}

// 煙火粒子類別
class Particle {
  constructor(x, y, color, size = 2) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(3, 12)); // 增加粒子速度
    this.acc = createVector(0, 0);
    this.color = color;
    this.size = size;
    this.lifespan = 255;
    this.decay = random(2, 6); // 隨機衰減速度
  }

  done() {
    return this.lifespan < 0;
  }

  update() {
    this.vel.add(gravity);
    this.pos.add(this.vel);
    this.lifespan -= this.decay;
    
    // 加入尾跡效果
    if (random() < 0.3) {
      this.vel.mult(0.98);
    }
  }

  show() {
    if (!this.done()) {
      stroke(
        red(this.color),
        green(this.color),
        blue(this.color),
        this.lifespan
      );
      strokeWeight(this.size);
      point(this.pos.x, this.pos.y);
      
      // 加入光暈效果
      strokeWeight(this.size * 0.5);
      stroke(
        red(this.color),
        green(this.color),
        blue(this.color),
        this.lifespan * 0.5
      );
      point(this.pos.x, this.pos.y);
    }
  }
}