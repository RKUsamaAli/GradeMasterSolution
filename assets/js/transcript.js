import { getData, queryByKeyValue } from "./firebaseConfig.js";

import { getCookie, COLLECTIONS, calculateGPA } from "./common.js";

document.getElementById('loader').style.display = 'block';
document.getElementById('contentSection').style.display = 'none';
let user = JSON.parse(getCookie("user"));
document.addEventListener("DOMContentLoaded", async () => {
    await getData(`${COLLECTIONS.users}/${user.id}`).then((snap) => {
        document.getElementById("username").innerHTML = snap.val().name;
        document.getElementById("username1").innerHTML = snap.val().name;
        document.getElementById("role").innerHTML = snap.val().role;
    })
});

// users-separation based on role

let content = ``;
if (user.role === "Admin" || user.role === "Super Admin") {
    content += `
    <li class="nav-item">
        <a class="nav-link collapsed" href="user.html">
          <i class="bi bi-person-circle"></i>
          <span>Users</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link collapsed" href="course.html">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>Courses</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link collapsed" href="semester.html">
          <i class="bi bi-calendar3"></i>
          <span>Semesters</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link collapsed" href="subject.html">
          <i class="bi bi-book"></i>
          <span>Subjects</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link collapsed" href="students.html">
          <i class="bi bi-people"></i>
          <span>Students</span>
        </a>
      </li>`
}

if (user.role === "Admin" || user.role === "Super Admin" || user.role === "Teacher") {
    content += `<li class="nav-item">
        <a class="nav-link collapsed" href="marks.html">
          <i class="fa-solid fa-check"></i>
          <span>Marks</span>
        </a>
      </li>`
}

if (user.role === "Student") {
    content += `<li class="nav-item">
        <a class="nav-link collapsed" href="transcript.html">
          <i class="fa-regular fa-file"></i>
          <span>Transcript</span>
        </a>
      </li>`
}

content += `
<li class="nav-item">
  <a class="nav-link collapsed" href="users-profile.html">
    <i class="bi bi-person"></i>
    <span>Profile</span>
  </a>
</li>`

document.getElementById("sidebar-nav").innerHTML = content;

// Calculate GPA and CGPA

var gpatxt = ``;
let student;
await getData(`${COLLECTIONS.students}/${user.id}`).then((snap) => {
    student = snap.val();
})
let course;
await getData(`${COLLECTIONS.courses}/${student.courseId}`).then((snap) => {
    course = snap.val();
    course.id = snap.key;
});
let semesters = await queryByKeyValue(COLLECTIONS.semesters, "courseId", course.id);
for (let i = 0; i < semesters.length; i++) {
    var marks = [];
    marks = await queryByKeyValue(COLLECTIONS.marks, "studentId", user.id, "semesterId", semesters[i].id);
    if (marks.length !== 0) {
        gpatxt += `
        <div class="col-lg-12">
        <div class="card">
            <div class="card-body">
              <h5 class="card-title">Semester:  ${semesters[i].name}</h5>
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Subjects</th>
                    <th scope="col">Cr Hr</th>
                    <th scope="col">Marks</th>
                    <th scope="col">Grade</th>
                  </tr>
                </thead>
                <tbody>`;
        for (let j = 0; j < marks.length; j++) {
            let subject;
            await getData(`${COLLECTIONS.subjects}/${marks[j].subjectId}`).then((snap) => {
                subject = snap.val();
            });
            gpatxt += `
                        <tr>
                            <td>${subject.name}</td>
                            <td>${subject.credit}</td>
                            <td>${marks[j].marks}</td>
                            <td>${marks[j].grade}</td>
                        </tr>`;
        }
        gpatxt += `</tbody>
              </table>`
        let gpa = await calculateGPA(user.id, false, semesters[i].id)
        gpatxt += `
              <span class="card-title" style="color:black;">GPA:  ${gpa}</span>
            </div>  
            </div>
          </div>`
    }
}
if (gpatxt === "") {
    gpatxt = `<div class="col-lg-6">
        <div class="card">
            <div class="card-body">
              <h5 class="card-title">Your Transcript is empty!!!</h5>
            </div>`
}
let cgpa = await calculateGPA(user.id, false);
document.getElementById("courseName").innerHTML = `${course.name}`;
document.getElementById("CGPA").innerHTML = `CGPA: ${cgpa}`;
document.getElementById("semesterGPA").innerHTML = gpatxt;
document.getElementById('contentSection').style.display = 'block';
document.getElementById('loader').style.display = 'none';

