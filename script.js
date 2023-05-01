const container = document.getElementById('game-container')
const width = document.getElementById('width')
const height = document.getElementById('height')
const showWidth = document.getElementById('showWidth')
const showHeight = document.getElementById('showHeight')
const WATER = 3
const ADJACENT = 2
const ADJACENTADJACENT = 1
const max_depth = 2

width.value = 5
height.value = 5
showWidth.textContent = width.value
showHeight.textContent = height.value

let w = width.value
let h = height.value
container.style.gridTemplateColumns = `repeat(${w}, 1fr)`
container.style.gridTemplateRows = `repeat(${h}, 1fr)`
for (let i = 0; i < w * h; i++) {
    let div = document.createElement('div')
    div.className = 'tile'
    container.appendChild(div)
}

function show(grid) {
    let children = container.childNodes
    for (let i = 0; i < children.length; i++) {
        let child = children[i]
        let y = i % grid.length
        let x = Math.floor(i / grid.length)
        if (grid[y][x] === WATER) {
            child.style.backgroundColor = 'aqua'
        } else {
            child.style.backgroundColor = 'green'
        }
    }
}

function createGrid(w, h) {
    return Array.from(Array(h), () => Array.from(Array(w)).fill(0))
}

function countNeighbors(grid, y, x, value) {
    let result = 0
    for (let [y2, x2] of [[y, x - 1], [y, x + 1], [y - 1, x], [y + 1, x]]) {
        if (y2 < 0 || y2 >= grid.length || x2 < 0 || x2 >= grid[y].length) { continue }
        result += grid[y2][x2] === value ? 1 : 0
    }
    return result
}

function anySpecialPattern(grid, y, x) {
    // Check from the middle pos
    // 1 - 2 - 1 Vertical And Horizontal
    if (x >= 1 && x < grid[y].length - 1) {
        return grid[y][x - 1] === ADJACENTADJACENT &&
            grid[y][x + 1] === ADJACENTADJACENT
    } else if (y >= 1 && y < grid.length - 1) {
        return grid[y - 1][x] === ADJACENTADJACENT &&
            grid[y][x + 1] === ADJACENTADJACENT
    }
}

function updateAdjacent(grid, y, x, value) {    
    if (value <= 1) { return }

    if (x >= 1 && grid[y][x - 1] < value) {
        grid[y][x - 1] = value - 1
        updateAdjacent(grid, y, x - 1, value - 1)
    }
    if (x < grid[y].length - 1 && grid[y][x + 1] < value) {
        grid[y][x + 1] = value - 1
        updateAdjacent(grid, y, x + 1, value - 1)
    }
    if (y >= 1 && grid[y - 1][x] < value) {
        grid[y - 1][x] = value - 1
        updateAdjacent(grid, y - 1, x, value - 1)
    }
    if (y < grid.length - 1 && grid[y + 1][x] < value) {
        grid[y + 1][x] = value - 1
        updateAdjacent(grid, y + 1, x, value - 1)
    }
}

async function solve(grid, depth) {
    if (depth > max_depth) { return [] }

    let grids = []

    while (grid.some(row => row.some(val => val === 0 || val === 1))) {

        let changed = false
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] >= WATER || countNeighbors(grid, y, x, ADJACENTADJACENT) < 2) { continue }

                if (grid[y][x] < ADJACENT) {
                    grid[y][x] = WATER
                    updateAdjacent(grid, y, x, WATER)
                    changed = true
                } else if (grid[y][x] === ADJACENT && anySpecialPattern(grid, y, x)) {
                    let t = structuredClone(grid)
                    t[y][x] = WATER
                    updateAdjacent(t, y, x, WATER)
                    
                    solve(t, depth + 1).then(res => res.forEach(g => grids.push(g)))
                }
            }
        }

        if (!changed) {
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    if (grid[i][j] === ADJACENTADJACENT) {
                        grid[i][j] = WATER
                        updateAdjacent(grid, i, j, WATER)
                    }
                }
            }
        }
    }
    grids.push(grid)
    return grids
}

function fixOneLine(grid) {
    let wait = 1
    let lastX
    let lastY
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (wait >= 2) {
                grid[y][x] = WATER
                updateAdjacent(grid, y, x, WATER)
                wait = 0
            } else { wait++ }
            lastX = x
            lastY = y
        }
    }
    if (wait == 2) { grid[lastY][lastX] = WATER; updateAdjacent(grid, lastY, lastX, WATER) }
    return grid
}

async function main() {
    let w = parseInt(width.value)
    let h = parseInt(height.value)
    let grid = createGrid(w, h)
    let solution
    let min = 0

    let s = performance.now()
    if (w <= 1 || h <= 1) {
        solution = await fixOneLine(grid)
    } else {
        grid[0][1] = WATER
        updateAdjacent(grid, 0, 1, WATER)
        let solutions = await solve(grid, 0)
        // Sort By Amount Of Water
        min = Number.POSITIVE_INFINITY
        for (let i = 0; i < solutions.length; i++) {
            let count = 0
            for (let y = 0; y < solutions[i].length; y++) {
                for (let x = 0; x < solutions[i][y].length; x++) {
                    if (solutions[i][y][x] === WATER) { count++ }
                }
            }
            if (count < min) {
                solution = solutions[i]
                min = count
            }
        }
        console.log(solutions)
    }
    console.log(performance.now() - s)
    show(solution)
    return solution
}

function resetColor() {
    for (let child of container.childNodes) {
        child.style.backgroundColor = 'white'
    }
}
width.addEventListener('input', () => {
    let children = container.childNodes
    let w = parseInt(width.value)
    let h = parseInt(height.value)
    let oldW = parseInt(showWidth.textContent)
    let diff = w - oldW

    if (diff > 0) { // Add
        for (let i = 0; i < diff * h; i++) {
            let div = document.createElement('div')
            div.className = 'tile'
            container.appendChild(div)
        }
    } else { // Remove
        let removed = 0
        let cap = oldW + diff - 1
        for (let i = 0; i < oldW * h; i++) {
            if ((i % oldW) > cap) {
                container.removeChild(children[i - removed])
                removed++
            }
            children[i - removed].backgroundColor = 'white'
        }
    }
    showWidth.textContent = width.value
    container.style.gridTemplateColumns = `repeat(${width.value}, 1fr)`
    resetColor()
})
height.addEventListener('input', () => {
    let children = container.childNodes
    let w = parseInt(width.value)
    let h = parseInt(height.value)
    let oldH = parseInt(showHeight.textContent)
    let diff = h - oldH

    if (diff > 0) { // Add
        for (let i = 0; i < diff * w; i++) {
            let div = document.createElement('div')
            div.className = 'tile'
            container.appendChild(div)
        }
    } else { // Remove
        let removed = 0
        let cap = oldH + diff - 1
        for (let i = 0; i < oldH * w; i++) {
            if ((i % oldH) > cap) {
                container.removeChild(children[i - removed])
                removed++
            }
        }
    }
    showHeight.textContent = height.value
    container.style.gridTemplateRows = `repeat(${height.value}, 1fr)`
    resetColor()
})