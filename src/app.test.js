
const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals before requiring app.js
const mockElement = {
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: { setProperty: () => {} },
    children: [],
    appendChild: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    innerText: '',
    value: '',
    focus: () => {}
};

global.document = {
    getElementById: () => mockElement,
    querySelector: () => mockElement,
    createElement: () => mockElement,
    head: { appendChild: () => {} }
};
global.window = { addEventListener: () => {}, onload: null };
global.localStorage = { getItem: () => null, setItem: () => {} };

const { generateMathProblem } = require('./app.js');

test('generateMathProblem - difficulty 1', (t) => {
    // We should test multiple times due to randomness
    for (let i = 0; i < 100; i++) {
        const problem = generateMathProblem(1);
        assert.ok(problem.text, 'Problem should have text');
        assert.notStrictEqual(problem.answer, null, 'Problem should have an answer');

        if (problem.type === 'num') {
            assert.strictEqual(typeof problem.answer, 'number', 'Answer should be a number for type num');
            if (problem.text.includes('+')) {
                const parts = problem.text.split(' + ');
                const a = parseInt(parts[0]);
                const b = parseInt(parts[1]);
                assert.strictEqual(a + b, problem.answer, 'Addition answer should be correct');
                assert.ok(a <= 20, 'aAdd should be <= 20 for difficulty 1');
            }
        }
    }
});

test('generateMathProblem - difficulty 2', (t) => {
    for (let i = 0; i < 100; i++) {
        const problem = generateMathProblem(2);
        assert.ok(problem.text);
        assert.notStrictEqual(problem.answer, null);
    }
});

test('generateMathProblem - difficulty 3', (t) => {
    for (let i = 0; i < 100; i++) {
        const problem = generateMathProblem(3);
        assert.ok(problem.text);
        assert.notStrictEqual(problem.answer, null);
    }
});

test('generateMathProblem - difficulty 4', (t) => {
    for (let i = 0; i < 100; i++) {
        const problem = generateMathProblem(4);
        assert.ok(problem.text);
        assert.notStrictEqual(problem.answer, null);
    }
});

test('generateMathProblem - specific types', (t) => {
    const originalRandom = Math.random;

    // Difficulty 1 only has 'add' and 'sub', so availableTypes = ['add', 'sub']

    // Test 'add'
    Math.random = () => 0.25; // Math.floor(0.25 * 2) = 0 -> 'add'
    let problem = generateMathProblem(1);
    assert.ok(problem.text.includes('+'), `Expected 'add', got ${problem.text}`);
    assert.strictEqual(eval(problem.text), problem.answer);

    // Test 'sub'
    Math.random = () => 0.75; // Math.floor(0.75 * 2) = 1 -> 'sub'
    problem = generateMathProblem(1);
    assert.ok(problem.text.includes('-'), `Expected 'sub', got ${problem.text}`);
    assert.strictEqual(eval(problem.text), problem.answer);

    // Difficulty 3 has ['add', 'sub', 'mul', 'comp', 'div', 'round'] (length = 6)
    // Test 'mul'
    Math.random = () => 0.4; // Math.floor(0.4 * 6) = 2 -> 'mul'
    problem = generateMathProblem(3);
    assert.ok(problem.text.includes('×'), `Expected 'mul', got ${problem.text}`);
    assert.strictEqual(eval(problem.text.replace('×', '*')), problem.answer);

    // Test 'div'
    Math.random = () => 0.7; // Math.floor(0.7 * 6) = 4 -> 'div'
    problem = generateMathProblem(3);
    assert.ok(problem.text.includes(':'), `Expected 'div', got ${problem.text}`);
    const divParts = problem.text.split(' : ');
    assert.strictEqual(parseInt(divParts[0]) / parseInt(divParts[1]), problem.answer);

    // Test 'comp'
    Math.random = () => 0.55; // Math.floor(0.55 * 6) = 3 -> 'comp'
    problem = generateMathProblem(3);
    assert.strictEqual(problem.type, 'comp');
    assert.ok(['<', '>', '='].includes(problem.answer));

    // Test 'round'
    Math.random = () => 0.95; // Math.floor(0.95 * 6) = 5 -> 'round'
    problem = generateMathProblem(3);
    assert.ok(problem.text.includes('Zaokrouhli'), `Expected 'round', got ${problem.text}`);
    assert.strictEqual(problem.answer % 10, 0);

    Math.random = originalRandom;
});
