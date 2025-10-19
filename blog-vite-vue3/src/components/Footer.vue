<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <p>邮箱: 1531836131@qq.com</p>
        </div>
      </div>
      <div class="footer-section">

          <p>这里记录我的技术学习历程和生活感悟，欢迎交流讨论。</p>
      </div>
      <img src="../../public/mzk2.png" alst="">
    </div>
  </footer>
</template>

<style scoped>
.container {
  margin: 0 auto;               /* 水平居中 */
  padding: 0 1rem;              /* 统一左右内边距 */
  position: relative;

}


img {
  width: 80px;
  height: 80px;
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 50%;

}
.footer {
  background-color: rgb(244, 214, 228);
  color: #6c757d;
  padding: 15px 0;
  text-align: center;
  border-radius: 20px;
  opacity: 0.4;
  box-shadow: 2px 2px 4px rgba(11, 11, 11, 0.1);
}
</style>