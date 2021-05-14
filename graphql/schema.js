const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull
} = require('graphql');

const { ValidationError } = require('../helpers/errors.helper');

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () =>  ({

    // query course by ID
    course: {
      type: courseType,

      // specify args to query by
      args: {
        id: { type: GraphQLNonNull(GraphQLString), description: "Course Department concatenated with Course Number. Ex: COMPSCI161" }
      },

      // define function to get a course
      resolve: (_, {id}) => {
        return getCourse(id);
      },

      // documentation
      description: "Search courses by their course id. Ex: COMPSCI161"
    },

    // get instructor by ucinetid
    instructor: {
      type: instructorType,

      // specify args to query by (ucinetid)
      args: {
        ucinetid: { type: GraphQLNonNull(GraphQLString) }
      },

      // define function to get a instructor
      resolve: (_, {ucinetid}) => {
        return getInstructor(ucinetid);
      },

      // documentation for instructor
      description: "Search instructors by their ucinetid"
    },

    // return all courses
    allCourses: {
      type: GraphQLList(courseType),

      // get all courses from courses cache
      resolve: () => {
        return getAllCourses()
      },

      // documentation for all courses
      description: "Return all courses. Takes no arguments"
    },

    // return all instructor
    allInstructors: {
      type: GraphQLList(instructorType),

      // get all instructors from cache
      resolve: () => {
        return getAllInstructors();
      },

      // documentation for all instructors
      description: "Return all instructors. Takes no arguments"
    },

    schedule: {
      type: GraphQLList(courseType),

      args: { ...scheduleArgs },

      resolve: async (_, args) => {
        validateScheduleArgs(args)
        const query = scheduleArgsToQuery(args);
        const results = await getCourseSchedules(query);
        return results
      },

      description: "Return schedule from websoc."
    },

    grades: {
      type: gradeDistributionCollectionType,

      args: {
        year: { type: GraphQLString },
        quarter: { type: GraphQLString },
        instructor: { type: GraphQLString },
        department: { type: GraphQLString },
        number: { type: GraphQLString },
        code: { type: GraphQLFloat }
      },

      resolve: (_, args) => {
        // Send request to rest
        var query = {
            ... args
        }
        const where = parseGradesParamsToSQL(query);
        const gradeResults = queryDatabaseAndResponse(where, false)
        const aggregateResult = queryDatabaseAndResponse(where, true).gradeDistribution
    
        // Format to GraphQL
        let aggregate = {
          sum_grade_a_count: aggregateResult['SUM(gradeACount)'],
          sum_grade_b_count: aggregateResult['SUM(gradeBCount)'],
          sum_grade_c_count: aggregateResult['SUM(gradeCCount)'],
          sum_grade_d_count: aggregateResult['SUM(gradeDCount)'],
          sum_grade_f_count: aggregateResult['SUM(gradeFCount)'],
          sum_grade_p_count: aggregateResult['SUM(gradePCount)'],
          sum_grade_np_count: aggregateResult['SUM(gradeNPCount)'],
          sum_grade_w_count: aggregateResult['SUM(gradeWCount)'],
          average_gpa: aggregateResult['AVG(averageGPA)']
        }

        let gradeDistributions = gradeResults.map(result => {
          return {
            grade_a_count: result.gradeACount,
            grade_b_count: result.gradeBCount,
            grade_c_count: result.gradeCCount,
            grade_d_count: result.gradeDCount,
            grade_f_count: result.gradeFCount,
            grade_p_count: result.gradePCount,
            grade_np_count: result.gradeNPCount,
            grade_w_count: result.gradeWCount,
            average_gpa: result.averageGPA != "nan"? result.averageGPA : null,
            course_offering: {
              year: result.year,
              quarter: result.quarter,
              section: {
                code: result.code,
                number: result.section,
                type: result.type,
              },
              instructors: [result.instructor],
              course: result.department.replace(/\s/g, '')+result.number,
            }
          }
        })
        
        let result = {
          aggregate: aggregate,
          grade_distributions: gradeDistributions
        }
        
        return result;
      },

      description: "Search for grades."
    }
})});


const schema = new GraphQLSchema({query: queryType});

module.exports = {schema};
