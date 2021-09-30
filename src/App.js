import "./App.css";
import { useRef } from "react";

function App() {
  const inputExpressionElement = useRef();
  function tokenizer(input) {
    let current = 0;

    let tokens = [];

    while (current < input.length) {
      let char = input[current];

      if (char === "(") {
        tokens.push({
          type: "paren",
          value: "(",
        });
        current++;
        continue;
      }
      if (char === ")") {
        tokens.push({
          type: "paren",
          value: ")",
        });

        current++;
        continue;
      }

      let WHITESPACE = /\s/;
      if (WHITESPACE.test(char)) {
        current++;
        continue;
      }

      let NUMBERS = /[0-9]/;

      if (NUMBERS.test(char)) {
        let value = "";

        while (NUMBERS.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push({ type: "number", value });

        continue;
      }

      if (char === '"') {
        let value = "";

        char = input[++current];

        while (char !== '"') {
          value += char;
          char = input[++current];
        }

        char = input[++current];

        tokens.push({ type: "string", value });

        continue;
      }

      let LETTERS = /[a-z]/i;

      if (LETTERS.test(char)) {
        let value = "";

        while (LETTERS.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push({ type: "name", value });

        continue;
      }

      throw new TypeError("I dont know what this character is: " + char);
    }

    console.log("TOKENS");
    console.log(tokens);

    return tokens;
  }

  function parser(tokens) {
    let current = 0;

    function walk() {
      let token = tokens[current];

      if (token.type === "number") {
        current++;

        return {
          type: "NumberLiteral",
          value: token.value,
        };
      }

      if (token.type === "string") {
        current++;

        return {
          type: "StringLiteral",
          value: token.value,
        };
      }

      if (token.type === "paren" && token.value === "(") {
        token = tokens[++current];

        let node = {
          type: "CallExpression",
          name: token.value,
          params: [],
        };

        token = tokens[++current];

        while (
          token.type !== "paren" ||
          (token.type === "paren" && token.value !== ")")
        ) {
          node.params.push(walk());
          token = tokens[current];
        }

        current++;

        return node;
      }

      throw new TypeError(token.type);
    }

    let ast = {
      type: "Program",
      body: [],
    };

    while (current < tokens.length) {
      ast.body.push(walk());
    }

    console.log("\nABSTRACT SYNTAX TREE");
    console.log(JSON.stringify(ast, null, 2));

    return ast;
  }
  function traverser(ast, visitor) {
    function traverseArray(array, parent) {
      array.forEach((child) => {
        traverseNode(child, parent);
      });
    }

    function traverseNode(node, parent) {
      let methods = visitor[node.type];

      if (methods && methods.enter) {
        methods.enter(node, parent);
      }

      switch (node.type) {
        case "Program":
          traverseArray(node.body, node);
          break;

        case "CallExpression":
          traverseArray(node.params, node);
          break;

        case "NumberLiteral":
        case "StringLiteral":
          break;

        default:
          throw new TypeError(node.type);
      }

      if (methods && methods.exit) {
        methods.exit(node, parent);
      }
    }

    traverseNode(ast, null);
  }

  function transformer(ast) {
    let newAst = {
      type: "Program",
      body: [],
    };

    ast._context = newAst.body;

    traverser(ast, {
      NumberLiteral: {
        enter(node, parent) {
          parent._context.push({
            type: "NumberLiteral",
            value: node.value,
          });
        },
      },

      StringLiteral: {
        enter(node, parent) {
          parent._context.push({
            type: "StringLiteral",
            value: node.value,
          });
        },
      },

      CallExpression: {
        enter(node, parent) {
          let expression = {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: node.name,
            },
            arguments: [],
          };

          node._context = expression.arguments;

          if (parent.type !== "CallExpression") {
            expression = {
              type: "ExpressionStatement",
              expression: expression,
            };
          }

          parent._context.push(expression);
        },
      },
    });
    console.log("\nNEW ABSTRACT SYNTAX TREE");
    console.log(JSON.stringify(newAst, null, 2));

    return newAst;
  }

  function codeGenerator(node) {
    switch (node.type) {
      case "Program":
        return node.body.map(codeGenerator).join("\n");
      case "ExpressionStatement":
        return (
          codeGenerator(node.expression) + ";" // << (...because we like to code the *correct* way)
        );

      case "CallExpression":
        return (
          codeGenerator(node.callee) +
          "(" +
          node.arguments.map(codeGenerator).join(", ") +
          ")"
        );

      case "Identifier":
        return node.name;

      case "NumberLiteral":
        return node.value;

      case "StringLiteral":
        return '"' + node.value + '"';

      default:
        throw new TypeError(node.type);
    }
  }

  const compiler = (input) => {
    console.log("INPUT EXPRESSION\n" + inputExpressionElement.current.value);
    inputExpressionElement.current.value = "";
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(newAst);

    console.log("\nOUTPUT CODE");
    console.log(output);

    return output;
  };

  return (
    <div className="main-card">
      <div className="logo-and-name">
        <i class="fas fa-brain fa-5x"></i>
        <h1>Cool Compiler</h1>
      </div>
      <div className="input-and-button">
        <label>
          Input Expression
          <br />
          <input className="form-control" ref={inputExpressionElement} />
        </label>
        <button
          className="btn btn-primary btn-block"
          onClick={() => compiler(inputExpressionElement.current.value)}
        >
          Compile
        </button>
      </div>
      <br />
    </div>
  );
}

export default App;
