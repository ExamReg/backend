const db = require("../../models/index");
const response = require("../../utils/response");
const {getExamRegistered} = require("../../utils/query/exam");
const createFile = require("../../utils/createFileExamRegistered");
const fs = require("fs");

async function getSemestersOfStudent(req, res) {
    try {
        let sql = "SELECT\n" +
            "    S.id_semester, S.value\n" +
            "FROM\n" +
            "    CourseStudent CSt\n" +
            "        INNER JOIN\n" +
            "    CourseSemester CSe ON CSe.id_cs = CSt.id_cs\n" +
            "        INNER JOIN\n" +
            "    Semester AS S ON CSe.id_semester = S.id_semester\n" +
            "WHERE\n" +
            "    id_student = :id_student\n" +
            "group by S.id_semester" +
            " order by S.create_time DESC";
        let semesters = await db.sequelize.query(sql, {
            replacements: {
                id_student: req.tokenData.id_student
            },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return res.json(response.buildSuccess({semesters}))
    } catch (err) {
        console.log("getSemestersOfStudent:", err.message);
        return res.json(response.buildFail(err.message))
    }
}

async function getCoursesOfStudent(req, res) {
    try {
        let {id_semester} = req.query;
        if (!id_semester) {
            throw new Error("Bạn chưa chọn kì học nào.")
        }
        let sql = "select C.id_course, C.course_name, CSt.is_eligible, CSe.is_done from CourseStudent CSt\n" +
            "\tinner join CourseSemester CSe on CSe.id_cs = CSt.id_cs\n" +
            "    inner join Course as C on CSe.id_course = C.id_course\n" +
            "where id_student = :id_student and CSe.id_semester = :id_semester ";
        sql = sql + " order by C.course_name ASC";
        let courses = await db.sequelize.query(sql, {
            replacements: {
                id_student: req.tokenData.id_student,
                id_semester: id_semester
            },
            type: db.Sequelize.QueryTypes.SELECT
        });
        return res.json(response.buildSuccess({courses}));
    } catch (err) {
        console.log("getCoursesOfStudent: ", err.message);
        return res.json(response.buildFail(err.message));
    }
}

async function printExamRegisteredInSemester(req, res){
    try{
        let {id_semester} = req.query;
        if(!id_semester){
            throw new Error("Vui lòng chọn 1 kỳ học.")
        }
        let semester = await db.Semester.findOne({
            where: {
                id_semester: id_semester
            }
        });
        if(!semester){
            throw new Error("Kì học bạn chọn không tồn tại.")
        }
        let exams = await getExamRegistered(id_semester, req.tokenData.id_student);
        if(exams.length <= 0 ){
            throw new Error("Bạn chưa đăng kí thi môn nào trong kì bạn đã chọn.")
        }
        let student = await db.Student.findOne({
            where: {
                id_student: req.tokenData.id_student
            }
        });
        let html = createFile({student: student.dataValues, exams});
        html = html.trim();
        html = html.replace(/(\r\n|\n|\r)/gm,"");
        html = html.replace(/(\\)/gm, '');
        let file_name = Date.now() + ".html";
        fs.writeFileSync("./uploads/" + file_name, html);
        return res.json(response.buildSuccess({file_name: file_name}));
    }
    catch(err){
        console.log("printExamRegistedInSemester: ", err.message);
        return res.json(response.buildFail(err.message))
    }
}

module.exports = {
    getSemestersOfStudent,
    getCoursesOfStudent,
    printExamRegisteredInSemester
};