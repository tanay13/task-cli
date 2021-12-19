const fs = require("fs");
const lineRead = require("readline");

// catching all the arguments passed
const args = process.argv;

const currentWorkingDirectory = args[1].slice(0, -8);

// storing all arguments except the first two
const command = args.slice(2);

//list all the commands
function usageInfo() {
  const info = `Usage :-
$ ./task add 2 hello world    # Add a new item with priority 2 and text "hello world" to the list
$ ./task ls                   # Show incomplete priority list items sorted by priority in ascending order
$ ./task del INDEX            # Delete the incomplete item with the given index
$ ./task done INDEX           # Mark the incomplete item with the given index as complete
$ ./task help                 # Show usage
$ ./task report               # Statistics`;
  console.log(info);
}

//list all tasks
async function showList() {
  if (!fs.existsSync(currentWorkingDirectory + "/task.txt")) {
    console.log("There are no pending tasks!");
    return;
  }

  var tasks = await readTasks();

  var idx = 0;
  for (const l of tasks) {
    if (l == "" || l == " ") continue;
    idx++;
    const p = l.split(" ")[0];
    var t = l.split(" ").splice(1).join(" ");
    console.log(idx + ". " + t + " " + "[" + p + "]");
  }
}

//reads task file and return an array of tasks
async function readTasks() {
  var tasks = [];
  var tsk = lineRead.createInterface({
    input: fs.createReadStream("task.txt"),
  });

  for await (const l of tsk) {
    tasks.push(l);
  }

  tasks.sort(function (x, y) {
    var b = Number(x.split(" ")[0]);
    var c = Number(y.split(" ")[0]);

    if (b > c) return 1;
    if (b < c) return -1;
  });

  return tasks;
}

//show the report
async function showReport() {
  var completed = [];
  var tasks = await readTasks();

  console.log("Pending : " + tasks.length);
  var idx = 0;
  for (const l of tasks) {
    if (l == "" || l == " ") continue;
    idx++;
    const p = l.split(" ")[0];
    var t = l.split(" ").splice(1).join(" ");
    console.log(idx + ". " + t + " " + "[" + p + "]");
  }
  console.log("");

  if (!fs.existsSync(currentWorkingDirectory + "/completed.txt")) {
    console.log("Completed : 0");
    return;
  }

  var cmplt = lineRead.createInterface({
    input: fs.createReadStream("completed.txt"),
  });

  for await (const l of cmplt) {
    completed.push(l);
  }
  console.log("Completed : " + completed.length);
  idx = 0;
  for (const l of completed) {
    if (l == "" || l == " ") continue;
    idx++;
    const p = l.split(" ")[0];
    var t = l.split(" ").splice(1).join(" ");
    console.log(idx + ". " + t);
  }
}

//add task
function addTask(priority, task) {
  if (task == undefined) {
    console.log("Error: Missing tasks string. Nothing added!");
    return;
  }

  if (!fs.existsSync(currentWorkingDirectory + "/task.txt")) {
    fs.writeFileSync(
      currentWorkingDirectory + "/task.txt",
      priority + " " + task,
      (err) => {
        if (err) console.error(err);
      }
    );
    console.log('Added task: "' + task + '" with priority ' + priority);
    return;
  }
  const prevTask = fs
    .readFileSync(currentWorkingDirectory + "/task.txt")
    .toString();

  prevTask.split(/^\r\n/).join("");
  if (prevTask != "") {
    fs.writeFileSync(
      currentWorkingDirectory + "/task.txt",
      prevTask + "\n" + priority + " " + task,
      (err) => {
        if (err) console.error(err);
      }
    );
  } else {
    fs.writeFile(
      currentWorkingDirectory + "/task.txt",
      priority + " " + task,
      (err) => {
        if (err) console.error(err);
      }
    );
  }
  console.log('Added task: "' + task + '" with priority ' + priority);
}

//delete a task
async function deleteTask(index) {
  if (index == undefined) {
    console.log("Error: Missing NUMBER for deleting tasks.");
    return;
  }

  var t = await readTasks();

  if (index > t.length || index <= 0) {
    console.log(
      "Error: task with index #" + index + " does not exist. Nothing deleted."
    );
    return;
  }

  t.splice(index - 1, 1);

  var data = "";

  for (tasks of t) {
    data += tasks + `\n`;
  }

  console.log("Deleted task " + "#" + index);

  var _ = fs.writeFileSync("task.txt", data);
}

//mark as done
async function doneTask(index) {
  // var tasks = await readTasks();
  var t = await readTasks();

  if (index == undefined) {
    console.log("Error: Missing NUMBER for marking tasks as done.");
    return;
  }

  if (index > t.length + 1 || index <= 0) {
    console.log("Error: no incomplete item with index #" + index + " exists.");
    return;
  }

  var doneTask = t[index - 1];

  t.splice(index - 1, 1);

  var data = "";

  for (tasks of t) {
    data += tasks + `\n`;
  }
  var _ = fs.writeFileSync("task.txt", data);

  if (!fs.existsSync(currentWorkingDirectory + "/completed.txt")) {
    fs.writeFileSync("completed.txt", doneTask, (err) => {
      if (err) console.error(err);
    });

    console.log("Marked item as done.");
    return;
  }

  const prevData = fs.readFileSync("completed.txt").toString();

  if (prevData != "") {
    fs.writeFileSync("completed.txt", prevData + "\n" + doneTask, (err) => {
      if (err) console.error(err);
    });
  } else {
    fs.writeFileSync("completed.txt", doneTask, (err) => {
      if (err) console.error(err);
    });
  }
  console.log("Marked item as done.");
}

switch (command[0]) {
  case undefined:
    usageInfo();
    break;
  case "help":
    usageInfo();
    break;

  case "ls":
    showList();
    break;

  case "report":
    showReport();
    break;

  case "add":
    try {
      addTask(command[1], command[2]);
    } catch (err) {
      console.error(err);
    }

    break;

  case "del":
    deleteTask(command[1]);
    break;

  case "done":
    doneTask(command[1]);
    break;
}
