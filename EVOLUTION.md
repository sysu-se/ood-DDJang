# Homework 2 Evolution 文档

## 1. 如何实现提示功能？

### 提示接口的归属

提示功能属于 **Sudoku**，而不是 Game。

**理由**：
- 候选数计算（candidates）是数独规则本身的逻辑，与游戏状态、历史管理无关
- Sudoku 已经持有棋盘数据 `grid`，可以独立计算候选数
- Game 的职责是协调流程（guess/undo/redo），不应该混入棋盘规则计算

### 实现方案

```javascript
// sudoku.js
getCandidates(row, col) {
  return getCandidates(grid, row, col);
}

getNextHint() {
  return findNakedSingle(grid);
}
```

**候选提示**：`getCandidates(row, col)` 返回某个格子所有可能的值（排除同行列宫已填数字）

**下一步提示**：`getNextHint()` 找到"唯一候选数"（naked single）——只有唯一一个候选值的空格

### 核心算法

```javascript
function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) return [];

  const used = getUsedValues(grid, row, col);
  return VALID_VALUES.filter(v => !used.includes(v));
}

function findNakedSingle(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const candidates = getCandidates(grid, row, col);
        if (candidates.length === 1) {
          return { row, col, value: candidates[0] };
        }
      }
    }
  }
  return null;
}
```

---

## 2. 提示功能更属于 Sudoku 还是 Game？为什么？

**更属于 Sudoku**。

| 维度 | Sudoku | Game |
|------|--------|------|
| 职责 | 棋盘数据与规则 | 游戏流程与历史 |
| 候选数计算 | ✅ 棋盘内部逻辑 | ❌ 无关 |
| 是否需要 history | ❌ 不需要 | ❌ 不需要 |
| 是否需要探索模式 | ❌ 不需要 | ❌ 不需要 |

Game 与 Sudoku 的协作：
```javascript
// Game 委托给 Sudoku 计算提示
getHint() {
  return currentSudoku.getNextHint();
}
```

---

## 3. 如何实现探索模式？

### 探索模式的本质

探索模式是 **Game 的状态切换**。

```
正常模式 ←→ 探索模式
   │            │
   │            ├── 独立的历史栈（explorationHistoryManager）
   │            ├── 独立的快照（explorationSnapshot）
   │            └── 自己的 undo/redo
```

### 核心设计

```javascript
// game.js
let isExploring = false;
let explorationSnapshot = null;
let explorationHistoryManager = null;
```

### 三种操作

| 操作 | 行为 |
|------|------|
| `enterExplore()` | 保存当前快照，创建独立历史栈，进入探索模式 |
| `commitExploration()` | 检查无冲突后放弃快照，保留探索历史到主历史 |
| `abandonExploration()` | 恢复到快照，清除探索历史，退出探索模式 |

### 冲突检测

```javascript
hasConflicts() {
  return currentSudoku.hasConflicts();
}

commitExploration() {
  if (currentSudoku.hasConflicts()) {
    return false;  // 探索失败，不能提交
  }
  // ...
}
```

---

## 4. 主局面与探索局面的关系是什么？

### 关系图

```
主局面（Main）
    │
    │ enterExplore()
    ▼
┌─────────────────┐
│  exploration    │
│  Snapshot       │  ← currentSudoku.clone()
├─────────────────┤
│  Exploration    │
│  History        │  ← 独立的 undo/redo 栈
└─────────────────┘
    │
    │ commitExploration() / abandonExploration()
    ▼
返回主局面
```

### 关键决策

| 问题 | 决策 | 原因 |
|------|------|------|
| 共享还是复制 | **复制**（snapshot clone） | 探索不影响主局面 |
| 深拷贝问题 | 使用 `deepClone()` | 避免引用共享 |
| 提交时合并 | explorationHistory → main history | 保留探索步骤的 undo 能力 |
| 放弃时回滚 | 恢复 snapshot | 干净地返回原始状态 |

### commit vs abandon 的区别

```javascript
commitExploration() {
  // 探索成功：无冲突，保留探索历史
  historyManager.push(explorationSnapshot);
  historyManager.mergeFrom(explorationHistoryManager);
  failedPathGrids.clear();
  // 清理探索状态...
}

abandonExploration() {
  // 探索失败：记录失败路径，恢复到快照，丢弃探索历史
  recordFailedPath();
  currentSudoku = explorationSnapshot;
  // 清理探索状态...
}
```

---

## 5. History 结构在本次作业中是否发生了变化？

**结构未变，但新增了合并能力**。

原有的线性 history 栈仍然适用于：
- 正常模式的 undo/redo
- 探索模式提交后的 undo/redo

新增的 HistoryManager 方法：
- `mergeFrom(otherManager)` — 将另一个 historyManager 的所有条目合并到当前主 history 中
- `getEntries()` — 获取所有历史条目的克隆（用于合并时避免引用污染）
- `appendEntries(entries)` — 追加条目到历史栈

新增的探索历史栈：
- 仅在探索模式期间使用
- 提交时通过 `mergeFrom` 合并到主历史
- 放弃时丢弃

```
正常模式:  [H1] → [H2] → [H3]
探索模式:  [E1] → [E2]
            ↓ commit
正常模式:  [H1] → [H2] → [H3] → [Snapshot] → [E1'] → [E2']
            ↓ abandon
恢复快照:  [H1] → [H2] → [H3]  (E1, E2 丢弃，失败路径被记忆)
```

---

### 探索失败路径记忆

为了满足作业要求中"记忆：用户多路径探索到已经失败的探索路径的某一棋盘时，告知用户探索失败"，新增了失败路径记忆功能：

```javascript
// game.js
const failedPathGrids = new Set();

function gridKey(grid) {
  return grid.map(row => row.join('')).join('|');
}

function recordFailedPath() {
  failedPathGrids.add(gridKey(currentSudoku.getGrid()));
}
```

当用户放弃探索时，当前棋盘状态（grid 快照）会被记录到 `failedPathGrids` 集合中。之后再次进入探索模式时，如果棋盘状态匹配某条失败路径，UI 会显示警告：

```svelte
{#if $gameDomain.isExploring && $gameDomain.isFailedPath}
  <div class="failed-path-warning">
    This path was previously explored and abandoned
  </div>
{/if}
```

---

### 两层提示（加分项：区分"仅提示位置"和"直接填写答案"）

为满足加分项要求，提示功能改为两层交互：

1. **第一层（位置提示）**：点击 Hint 按钮，显示当前选中格子的候选数集合和解释信息，不直接填写答案
2. **第二层（答案填写）**：再次点击 Hint 按钮，直接将正确答案填入

```javascript
// gameDomain.js
getHintInfo(pos) {
  // 返回候选数、答案、是否为推定数(naked single)、解释说明
  return { row, col, candidates, answer, isNakedSingle, explanation };
}
```

UI 层通过 `hintLevel` 状态变量跟踪当前提示阶段，切换光标位置时自动重置。

---

## 6. Homework 1 中的哪些设计，在 Homework 2 中暴露出了局限？

### 局限 1：Sudoku 没有保护 givens

**问题**：Sudoku.guess() 可以修改任意位置，包括初始数字

**影响**：探索模式下玩家可能修改 givens，破坏游戏规则

**本次修复**：添加 givens 掩码，guess() 会拒绝修改 given 格子

### 局限 2：HistoryManager 与 Game 耦合

**问题**：Game.undo() 需要传入 currentSnapshot

```javascript
undo() {
  const previousState = historyManager.undo(currentSudoku);
  if (previousState) {
    currentSudoku = previousState;
  }
}
```

**影响**：探索模式需要两套 historyManager，代码重复

**本次通过状态分支解决**：if (isExploring) 分支处理

### 局限 3：serialization 不支持 exploration 状态

**问题**：createGameFromJSON() 无法恢复探索状态

**影响**：探索状态不被持久化

**本次未解决**：探索状态需要额外序列化支持

---

## 7. 如果要重做一次 Homework 1/1.1，你会如何修改原设计？

### 1. Sudoku 增加 givens 保护

```javascript
function createSudoku(input) {
  const grid = deepClone(input);
  const givens = grid.map(row => row.map(cell => cell !== 0));

  return {
    guess(move) {
      if (givens[move.row][move.col]) {
        return false;  // 拒绝修改 given
      }
      grid[move.row][move.col] = move.value;
      return true;
    },

    isGiven(row, col) {
      return givens[row][col];
    }
  };
}
```

### 2. gameDomain 成为唯一数据源

```javascript
const state = writable({
  grid: null,        // 从 game.getGrid()
  givens: null,      // 从 game.getGivens()
  invalidCells: [],  // 从 game.getInvalidCells()
  canUndo: false,
  canRedo: false,
  isComplete: false
});
```

### 3. UI 只依赖 gameDomain

```svelte
<!-- Board/index.svelte -->
{#each $gameDomain.grid as row, y}
  {#each row as value, x}
    <Cell
      {value}
      userNumber={!$gameDomain.givens[y][x]}
      conflictingNumber={$gameDomain.invalidCells.includes(x + ',' + y)}
    />
  {/each}
{/each}
```

---

## 8. 代码审查问题修复记录

### 问题 1: Svelte 层仍保留旧 grid 流程

**修复**：
- Board/index.svelte 改用 `$gameDomain.grid`、`$gameDomain.givens`、`$gameDomain.invalidCells`
- Actions.svelte 改用 `gameDomain.getHint()`
- Share.svelte 改用 `encodeSudoku($gameDomain.grid)`

### 问题 2: 领域模型没有建模 givens

**修复**：
- Sudoku 增加 `givens` 掩码数组
- 增加 `isGiven(row, col)` 方法
- `guess()` 拒绝修改 given 格子
- Game 增加 `getGivens()`、`isGiven()` 方法

### 问题 3: 输入流程直接 mutate userGrid

**修复**：
- 移除 `userGrid` 直接暴露
- Keyboard.svelte 只调用 `gameDomain.guess()` 和 `gameDomain.clear()`

### 问题 4: 数独规则校验没有进入领域行为

**修复**：
- Sudoku.guess() 内部调用 `isValidPlacement()` 检查冲突
- 增加 `hasConflicts()`、`getInvalidCells()` 方法
- 增加 `isComplete()` 方法

### 问题 5: Svelte adapter 81次逐格写入

**修复**：
- `updateState()` 一次调用 `state.set()` 发布完整快照
- 不再逐格调用 `userGrid.set()`

---

## 9. 设计演进总结

| 作业 | 核心变化 |
|------|---------|
| HW1 | 创建 Sudoku/Game 对象，实现 undo/redo |
| HW1.1 | 拆分为多模块，添加验证和序列化 |
| HW2 | 添加提示功能、探索模式（状态切换） |
| HW2.1 | 统一数据源、建模 givens、优化同步效率 |
| HW2.2 | 探索失败路径记忆、探索历史合并、两层提示 |

### 本次新增/修改

- `solver.js` - 添加 `getInvalidCells`、`isValidPlacement`
- `sudoku.js` - 添加 givens 掩码、`isGiven()`、`getInvalidCells()`、`isComplete()`
- `history.js` - 添加 `getEntries()`、`appendEntries()`、`mergeFrom()`
- `game.js` - 添加 `getGivens()`、`isGiven()`、`getInvalidCells()`、`isComplete()`；探索失败路径记忆（`failedPathGrids`、`isFailedPath()`、`getFailedPathCount()`）；修复 `commitExploration()` 合并探索历史到主历史
- `gameDomain.js` - 统一状态快照、添加 `isFailedPath`/`failedPathCount` 状态、添加 `getHintInfo()` 两层提示接口
- `Board/index.svelte` - 只使用 gameDomain
- `Keyboard.svelte` - 只调用 gameDomain 方法
- `Actions.svelte` - 失败路径警告 UI、两层 Hint 交互（候选提示 + 答案填写）
- `Share.svelte` - 使用 gameDomain.grid

### 设计原则保持

- Sudoku 负责棋盘数据和规则
- Game 负责流程协调
- HistoryManager 负责状态管理
- Store Adapter 负责 Svelte 集成
- **gameDomain 成为唯一真实数据源**

---

## 10. UI 集成说明

### 提示功能 UI

| 功能 | 接口 | 说明 |
|------|------|------|
| 候选提示 | `gameDomain.getCandidates(pos)` | 返回当前格子所有候选数 |
| 下一步提示 | `gameDomain.getHint()` | 返回推定数（naked single）位置和值 |
| 直接填写 | `gameDomain.applyHint(pos)` | 在当前位置填入正确解 |

**UI 流程**：
1. 用户选中空格
2. 点击 Hint 按钮
3. `applyHint()` 调用 `solveSudoku()` 获取完整解
4. 将正确数字填入选中格子

### 探索模式 UI

| 按钮 | 颜色 | 功能 |
|------|------|------|
| 探索模式 | 紫色 | 进入探索模式（正常模式下显示） |
| 提交 | 绿色 | 提交探索结果（探索模式下显示） |
| 放弃 | 红色 | 放弃探索并回滚（探索模式下显示） |

**UI 逻辑**：
```javascript
{#if $gameDomain.isExploring}
  <button on:click={handleCommit}>提交</button>
  <button on:click={handleAbandon}>放弃</button>
{:else}
  <button on:click={handleExplore}>探索模式</button>
{/if}
```

### 提示能力归属总结

**提示能力属于 Sudoku**：

| 能力 | 归属 | 原因 |
|------|------|------|
| 候选数计算 | Sudoku | 数独规则本身，与游戏流程无关 |
| 推定数查找 | Sudoku | 基于棋盘状态的算法 |
| 解题求解 | Sudoku (通过外部 solver) | 棋盘状态计算 |

**Game 的职责**：
- 委托 Sudoku 计算提示
- 管理探索模式状态切换
- 协调 undo/redo（正常模式和探索模式）

---

## 11. 探索模式设计

### 核心状态

```javascript
let isExploring = false;           // 是否在探索模式
let explorationSnapshot = null;     // 进入探索前的快照
let explorationHistoryManager = null; // 探索模式专用历史栈
```

### 冲突检测

```javascript
// commitExploration 前的检查
if (currentSudoku.hasConflicts()) {
  return false;  // 探索失败，不能提交
}
```

### 回溯支持

探索模式下，undo/redo 使用独立的 `explorationHistoryManager`：
- 不影响正常模式的 history
- 放弃探索后，探索历史全部丢弃

### 失败路径记忆

当前实现中，失败探索通过以下方式处理：
1. 探索中有冲突时，`hasConflicts()` 返回 true
2. `commitExploration()` 在有冲突时返回 false
3. 用户可以 `abandonExploration()` 回滚到快照

**注意**：复杂的多路径探索记忆（记录哪些路径失败）在当前线性探索设计中暂未实现。