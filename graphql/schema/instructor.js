const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
  } = require('graphql');

var {getAllInstructors, getInstructor} = require('../helpers/instructor.helper')

const instructorType = new GraphQLObjectType({
    name: 'Instructor',
    fields: () => ({
      name: { type: GraphQLString },
      ucinetid: { type: GraphQLString },
      phone: { type: GraphQLString },
      title: { type: GraphQLString },
      department: { type: GraphQLString },
      schools: { type: GraphQLList(GraphQLString) },
      related_departments: { type: GraphQLList(GraphQLString) },
      course_history: { 
        type: GraphQLList(courseType),
        resolve: (instructor) => {
          return getInstructor(instructor.ucinetid)["course_history"].map(course_id => getCourse(course_id.replace(/ /g, "")));
        }
      }
    })
  });