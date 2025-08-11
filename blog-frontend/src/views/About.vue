<template>
  <div class="about">
    <div class="container">
      <div class="about-hero">
        <div class="hero-content">
          <i>Do not go gentle into that good night,<br>
      Old age should burn and rave at close of day;</i>
        </div>
        <h2><i>不要温和地走进那良夜，老年应当在日暮时燃烧咆哮。</i></h2>
        <p>—— Dylan Thomas</p>
      </div>

      <div class="about-content">
        <section class="skills-section">
          <h2>技术栈</h2>
          <div class="skills-grid">
            <div class="skill-category">
              <h3>前端开发</h3>
              <div class="skill-tags">
                <span class="skill-tag">Vue.js</span>
                <span class="skill-tag">React</span>
                <span class="skill-tag">JavaScript</span>
                <span class="skill-tag">TypeScript</span>
                <span class="skill-tag">CSS3</span>
                <span class="skill-tag">HTML5</span>
              </div>
            </div>
            
            <div class="skill-category">
              <h3>工具与框架</h3>
              <div class="skill-tags">
                <span class="skill-tag">Vite</span>
                <span class="skill-tag">Webpack</span>
                <span class="skill-tag">Node.js</span>
                <span class="skill-tag">Git</span>
                <span class="skill-tag">Docker</span>
              </div>
            </div>
            
            <div class="skill-category">
              <h3>后端开发</h3>
              <div class="skill-tags">
                <span class="skill-tag">Express</span>
                <span class="skill-tag">MongoDB</span>
                <span class="skill-tag">MySQL</span>
                <span class="skill-tag">Redis</span>
              </div>
            </div>
          </div>
        </section>


        <section class="contact-section">
          <h2>联系方式</h2>
          <div class="contact-grid">
            <div class="contact-item">
              <h4>📧 邮箱</h4>
              <p>1531836131@qq.com</p>
            </div>
            
            <div class="contact-item">
              <h4>💻 GitHub</h4>
              <p>github.com/qwqowo</p>
            </div>
            <div class="shijv">
              <h3>假如生活欺骗了你，不要悲伤，不要心急！忧郁的日子里须要镇静：相信吧，快乐的日子将会来临！</h3>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-tag {
  display: inline-block;
  background: #f0f0f0;
  color: #333;
  padding: 4px 12px;
  border-radius: 16px;
  margin: 2px 6px 2px 0;
  font-size: 14px;
}
.shijv{
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 20px;
  font-style: italic;
  margin-bottom: 20px;}
</style>

