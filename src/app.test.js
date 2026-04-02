
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

    // Test 'add'
    Math.random = () => 0.05; // types[Math.floor(0.05 * 6)] = types[0] = 'add'
    let problem = generateMathProblem(1);
    assert.ok(problem.text.includes('+'), `Expected 'add', got ${problem.text}`);
    assert.strictEqual(eval(problem.text.replace('×', '*').replace(':', '/')), problem.answer);

    // Test 'sub'
    Math.random = () => 0.2; // types[Math.floor(0.2 * 6)] = types[1] = 'sub'
    problem = generateMathProblem(1);
    assert.ok(problem.text.includes('-'), `Expected 'sub', got ${problem.text}`);
    assert.strictEqual(eval(problem.text), problem.answer);

    // Test 'mul'
    Math.random = () => 0.4; // types[Math.floor(0.4 * 6)] = types[2] = 'mul'
    problem = generateMathProblem(1);
    assert.ok(problem.text.includes('×'), `Expected 'mul', got ${problem.text}`);
    assert.strictEqual(eval(problem.text.replace('×', '*')), problem.answer);

    // Test 'div'
    Math.random = () => 0.6; // types[Math.floor(0.6 * 6)] = types[3] = 'div'
    problem = generateMathProblem(1);
    assert.ok(problem.text.includes(':'), `Expected 'div', got ${problem.text}`);
    const divParts = problem.text.split(' : ');
    assert.strictEqual(parseInt(divParts[0]) / parseInt(divParts[1]), problem.answer);

    // Test 'comp'
    Math.random = () => 0.75; // types[Math.floor(0.75 * 6)] = types[4] = 'comp'
    problem = generateMathProblem(1);
    assert.strictEqual(problem.type, 'comp');
    assert.ok(['<', '>', '='].includes(problem.answer));

    // Test 'round'
    Math.random = () => 0.95; // types[Math.floor(0.95 * 6)] = types[5] = 'round'
    problem = generateMathProblem(1);
    assert.ok(problem.text.includes('Zaokrouhli'), `Expected 'round', got ${problem.text}`);
    assert.strictEqual(problem.answer % 10, 0);

    Math.random = originalRandom;
});
