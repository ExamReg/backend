const db = require("../../models/index");
const response = require("../../utils/response");


async function getSemestersOfStudent(req, res) {
    try {
        let sql = "select S.id_semester, S.value from CourseStudent CSt\n" +
            "\tinner join CourseSemester CSe on CSe.id_cs = CSt.id_cs\n" +
            "    inner join Semester as S on CSe.id_semester = S.id_semester\n" +
            "where id_student = :id_student;";
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

module.exports = {
    getSemestersOfStudent,
    getCoursesOfStudent
};