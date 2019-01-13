# Batch Replacer

This extension allows to performs multiple text replacements at once, based on a script.

## Usage

1. Open a new file (`CTRL + N`)
2. Write a script using the following syntax:

    ```c
    replace "Alice"
    with "Bob"

    replace "Carol"
    with "David"
    ```

3. `CTRL + SHIFT + P` -> `Batch Replace`

    This will replace (across all files in the workspace):
    - all occurrences of "Alice" with "Bob"
    - then all occurrences of "Carol" with "David"

## Script syntax

### Commands

A basic command consists of a `replace` instruction and a `with` instruction.

```c
replace "Alice"
with "Bob"
```

### Comments

Lines that start with `//` are ignored.

```c
// Replace "Alice" with "Bob"
replace "Alice"
with "Bob"
```

### Regular expressions

In order to interpret the parameter of the `replace` instruction as a regular expression, use the `replace-regex`
instruction instead.

```c
// Replace "Alice" or "Alex" with "Bob"
replace-regex "Al(ice|ex)"
with "Bob"
```

The `replace-regex` instruction also allows to:

- replace with part of the matched text

    ```c
    // Replace, for example, "document 01-01-2018" with "2018 - Report"
    replace-regex "document \d{2}-\d{2}-(\d{4})"
    with "$1 - Report"
    ```

- replace with text containing the `\t` (tab), `\r` (carriage return), or `\n` (line feed) characters

    ```c
    // Replace "Label - Amount" with "Label{tab character}Amount"
    replace-regex "Label - Amount"
    with "Label\tAmount"
    ```

### Escaping characters

Unlike in most programming languages, **quotes** and **slashes** in the values of `replace` and `with` instructions
don't need escaping.

```c
// Input:
//     John said "oh"
// Output
//     John said "hello"
replace "said "oh""
with "said "hello""
```

```c
// Input:
//     C:\Users\johndoe\Documents\file1.txt
// Output
//     C:/Users/johndoe/Documents/file1.txt
replace "\"
with "/"
```

Slashes in **regular expression metacharacters** don't need escaping either.

```c
// Input:
//     this sentence should be obscured
// Output
//     ____ ________ ______ __ ________
replace "\w"
with "_"
```

### Filter files

To restrict a command to specific files, use the `in` instruction at the beginning of the command.

```c
// Replace "Alice" with "Bob" in the document.txt file in the root folder
in "document.txt"
replace "Alice"
with "Bob"
```

```c
// Replace "Alice" with "Bob" in the document.txt file in the Documents folder in the root folder
in "Documents/document.txt"
replace "Alice"
with "Bob"
```

```c
// Replace "Alice" with "Bob" in document.txt files anywhere
in "**/document.txt"
replace "Alice"
with "Bob"
```

```c
// Replace "Alice" with "Bob" in any .txt file in the root folder
in "*.txt"
replace "Alice"
with "Bob"
```

```c
// Replace "Alice" with "Bob" in any .txt file
in "**/*.txt"
replace "Alice"
with "Bob"
```

To restrict **all** commands to specific files, use the `filter` instruction at the beginning of the script.

```c
// Apply all commands only to .txt files
filter "**/*.txt"

// Replace "Alice" with "Bob" in any .txt file
replace "Alice"
with "Bob"

// Replace "Carol" with "David" in any .txt file
replace "Carol"
with "David"
```

You can combine the `filter` instruction (applied to all commands) with the `in` instruction applied to each command.

```c
// Apply all commands only to .txt files
filter "**/*.txt"

// Replace "Alice" with "Bob" in any .txt file in any Documents folder
in "**/Documents/*"
replace "Alice"
with "Bob"

// Replace "Carol" with "David" in any .txt file in any Reports folder
in "**/Reports/*"
replace "Carol"
with "David"
```

### Variables

Complex regular expressions can be created using variables. Variables are applied to the entire script, and should be
defined at the beginning of the script. Variables are defined as `... = {...}` and are used as `%[...]`. Variables
can only be used in the `replace` and `replace-regex` instructions.

```c
// Input:
//     C:\Users\johndoe\Desktop\My-Files\new file.txt
//     C:\Users\johndoe\Desktop\New Folder\photo.jpg
//     C:\Users\johndoe\My.Documents\doc.docx
//
// Output:
//     new file.txt
//     photo.jpg
//     doc.docx

// This is a variable
extension = "\.(txt|jpg|docx)"

// This is another variable
name = "[\w\. -]+"

// This is where the variables are used
replace-regex "C:(\\%[name])*\\(%[name]%[extension])"
with "$2"
```

Variables can reference themselves and be overwritten. Here is an advanced example:

```c
// Input:
//   export interface {
//       function1(): void;
//       function2(a: string | undefined): string[];
//       function3(a: Map<string, number>, b: string[], c: string): Set<number> | undefined;
//       function4(a: Class1.Type2): void;
//   }
//
// Output:
//   export interface {
//       function1: () => void;
//       function2: (a: string | undefined) => string[];
//       function3: (a: Map<string, number>, b: string[], c: string) => Set<number> | undefined;
//       function4: (a: Class1.Type2) => void;
//   }

name = "\w+"
type = "[\w\.]+"
type = "%[type](?:<\w+(?:, \w+)*>)?"
type = "%[type](?:\[\])?"
type = "%[type](?: \| %[type])?"
parameter = "%[name]: %[type]"
parameters = "(?:%[parameter](?:, %[parameter])*)?"

replace-regex "(%[name])\((%[parameters])\): (%[type])"
with "$1: ($2) => $3"
```