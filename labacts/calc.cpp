#include <iostream>
using namespace std;

int main() {
    double num1, num2;
    char op;

    cout << "Simple Arithmetic Calculator" << endl;
    cout << "Enter first number: ";
    cin >> num1;

    cout << "Enter an operator (+, -, *, /): ";
    cin >> op;

    cout << "Enter second number: ";
    cin >> num2;

    double result = 0;
    bool validOp = true;

    switch (op) {
        case '+':
            result = num1 + num2;
            break;
        case '-':
            result = num1 - num2;
            break;
        case '*':
            result = num1 * num2;
            break;
        case '/':
            if (num2 == 0) {
                cout << "Error: Division by zero is not allowed." << endl;
                return 1;
            }
            result = num1 / num2;
            break;
        default:
            validOp = false;
            break;
    }

    if (validOp) {
        cout << num1 << " " << op << " " << num2 << " = " << result << endl;
    } else {
        cout << "Error: Invalid operator entered." << endl;
    }

    return 0;
}