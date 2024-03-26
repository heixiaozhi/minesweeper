/**
 * DOM加载时进行游戏
 * 箭头函数的this是根据上下文确定的，它本身是没有this的
 * 普通函数的this=undefined,在监听函数中取决于被监听的dom元素
 * 监听函数的event dom元素的事件对象
 * 'DOMContentLoaded' 等dom完全加载完之后执行回调函数
 */
document.addEventListener('DOMContentLoaded',  function (event)  {
  const grid = document.querySelector('.grid')
  // 结果
  const result = document.querySelector('.result')
  // 标记数量
  const flagNumber = document.querySelector('.flag')
  // 标记显示数量
  let flags = 0
  // 棋盘行列数
  const width = 10
  // 炸弹数
  let bombAmount = 20
  // 元素集合
  let squares = []
  // 判断游戏结束
  let isGameOver = false
  // 标记数量
  flagNumber.innerHTML = '20'
  // 炸弹数量对象-保存对应的css样式
  const bombColor = {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'others',
    '6': 'others',
    '7': 'others',
    '8': 'others'
  }

  /**
   * 创建棋盘
   * 0) => 添加棋盘初始数据
   * 1) => 给每个元素添加标识
   * 2) => 将元素添加到容器中去
   * 3) => 给元素添加点击事件
   * 4) => 计算每个元素周围的炸弹数
   */
  function createBoard() {
    // 0)
    // 使用随机炸弹得到一个清洗的游戏数组
    // Array()这是数组的构造函数 等价于 => new Array()
    // 当只有一个数字参数时指的是数组个数(默认undefined)，否则是元素
    const bombArray = Array(bombAmount).fill('bomb')
    const emptyArray = Array(width * width - bombAmount).fill('valid')
    // contact 方法将数组合并返回一个新数组（浅拷贝）
    const gameArray = emptyArray.concat(bombArray)
    // 常用洗牌方法 1) random [0-1) 2)Array.sort compareFn确定排序顺序 正数[b,a] 负数[a,b]
    const shuffledArray = gameArray.sort(() => Math.random() - 0.5)

    for(let i = 0; i < width * width; i++) {
      const el = document.createElement('div')
      // 1)
      // 方法1 直接.进行更改(.id .className .data- .style) 添加类=>classList
      // 方法2 添加其他属性 setAttribute(属性名,属性值)
      el.id = i
      el.classList.add(shuffledArray[i])
      // el.setAttribute('id', i)

      // 2)
      // 插入元素的老方法 new method => append、prepend...
      grid.appendChild(el)
      // 加入到集合中去
      squares.push(el)

      // 3)
      // click 鼠标单击  event.preventDefault() 防止事件默认的效果
      // 这个匿名函数可以使用外层的作用域（作用域链）
      el.addEventListener('click', function () {
        leftClick(el)
      })
      // contextmenu 鼠标右击
      el.addEventListener('contextmenu', function (event) {
        // 去除默认右击浏览器选择等菜单
        event.preventDefault()
        rightClick(el)
      })
    }
    // 4)
    // 计算每个元素周围的炸弹数量，对边缘区域做一些限制
    for (let i = 0; i < squares.length; i++) {
      let total = 0
      const isLeftEdge = (i % width === 0)
      const isRightEdge = (i % width === width - 1)

      // 判断非炸弹的周围有多少炸弹
      // contains 判断类中是否包含某类
      if (squares[i].classList.contains('valid')) {
        // 1、判断四周
        // 不在最左边，计算左边的值
        if (!isLeftEdge && squares[i - 1].classList.contains('bomb')) total++
        // 不在最右边，计算右边的值
        if (!isRightEdge && squares[i + 1].classList.contains('bomb')) total++
        // 左上
        if (i > 9 && !isLeftEdge && squares[i - width - 1].classList.contains('bomb')) total++
        // 右上
        if (i > 9 && !isRightEdge && squares[i - width + 1].classList.contains('bomb')) total++
        // 上方
        if (i > 9 && squares[i - width].classList.contains('bomb')) total++
        // 下方
        if (i < 90 && squares[i + width].classList.contains('bomb')) total++
        // 左下
        if (i < 90 && !isLeftEdge && squares[i + width - 1].classList.contains('bomb')) total++
        // 右下
        if (i < 90 && !isRightEdge && squares[i + width + 1].classList.contains('bomb')) total++

        // 2、给该元素添加一个自定义属性
        squares[i].setAttribute('data', total)
      }
    }
  }

  /**
   * 鼠标单击
   * 0) 过滤已处理过的
   * 1) 判断该元素是否是炸弹，如是炸弹直接结束
   * 2) 标记该元素点击过
   */
  function leftClick(square) {
    // 0)
    // 游戏结束、已经被点击过、标记过
    if (isGameOver || square.classList.contains('checked') || square.classList.contains('flags')) {
      return
    }

    // 1)
    // 如果是炸弹直接结束
    // 标记当前元素，当前是数字就直接显示，是空的就探索周围
    if (square.classList.contains('bomb')) {
      gameOver()
    } else {
      // 注意获取来的是string类型，可以选择转换或者弱等于
      let total = square.getAttribute('data')
      if (total != 0) {
        // 添加数字对应的颜色
        square.classList.add(bombColor[total])
        // 设置元素的内容
        square.innerHTML = total
      } else {
        // 当前元素附近没有炸弹探索周围
        checkSquare(square)
      }
      // 标记点击过
      square.classList.add('checked')
    }
  }

  /**
   * 鼠标右击
   * 0) 过滤游戏结束、已经被点击过的、标记数量等于炸弹数量的
   * 1) 添加flag，对ui显示进行修改
   * 2) 判断游戏是否胜利
   */
  function rightClick(square) {
    // 0)
    if (isGameOver) return

    // 未被点击，标记数量小于炸弹数量
    if (!square.classList.contains('checked') && (flags < bombAmount)) {
      // 1)
      // 如果已经标记取消，未标记添加
      if (square.classList.contains('flags')) {
        square.classList.remove('flags')
        square.innerHTML = ''
        flags--
        flagNumber.innerHTML = String(bombAmount - flags)
      } else {
        square.classList.add('flags')
        flags++
        square.innerHTML = '🚩'
        flagNumber.innerHTML = String(bombAmount - flags)
      }
      // 2)
      // 判断游戏是否胜利
      checkForWin()
    }
  }

  /**
   * 当前元素不是炸弹探索周围
   * 0) 获取当前元素的id值
   * 1) 对四周的方向进行click
   * 形成了一个递归，由于是当前为空才进行搜索，当碰到数字、已被检查的、标记的停下来
   */
  function checkSquare(square) {
    // 0)
    // 获取来的id是字符串，通过+运算符转换
    const currentId = +square.id
    const isLeftEdge = (currentId % width === 0)
    const isRightEdge = (currentId % width === width - 1)

    // 延迟函数
    setTimeout(function ()  {
      // 左边
      if (!isLeftEdge) {
        const newId = currentId - 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 右边
      if (!isRightEdge) {
        const newId = currentId + 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 左上
      if (currentId > 9 && !isLeftEdge) {
        const newId = currentId - width - 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 右上
      if (currentId > 9 && !isRightEdge) {
        const newId = currentId - width + 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 上方
      if (currentId > 9) {
        const newId = currentId - width
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 下方
      if (currentId < 90) {
        const newId = currentId + width
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 左下
      if (currentId < 90 && !isLeftEdge) {
        const newId = currentId + width - 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
      // 右下
      if (currentId < 90 && !isRightEdge) {
        const newId = currentId + width + 1
        const newSquare = document.getElementById(String(newId))
        leftClick(newSquare)
      }
    }, 20)
  }

  /**
   * 游戏胜利
   * 0) 判断游戏胜利
   * 1) 提示信息
   */
  function checkForWin() {
    // 0)
    // 炸弹的地方被标记flags
    let matched = 0
    for (let i = 0; i < squares.length; i++) {
      if (squares[i].classList.contains('bomb') && squares[i].classList.contains('flags')) {
        matched++
      }
      // 1)
      // 胜利
      if (matched === bombAmount) {
        isGameOver = true
        result.innerHTML = 'You Win, good job, Guys'
      }
    }
  }

  /**
   * 游戏结束
   * 0) 标志置为true
   * 1) 设置提示信息
   * 2) 显示所有炸弹，并添加标记
   */
  function gameOver() {
    // 0)
    isGameOver = true
    // 1)
    result.innerHTML = 'BOOM! Game Over, thanks'
    // 2)
    // 遍历所有元素
    squares.forEach(function (square) {
      if (square.classList.contains('bomb')) {
        // 溢出bomb, 添加checked
        square.classList.remove('bomb')
        square.classList.add('checked')
        square.innerHTML = '💣'
      }
    })
  }

  createBoard()
})
