const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLFloat,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

var {getCourseSchedules} = require("../helpers/schedule.helper")

const scheduleArgs = {
    year: { type: GraphQLNonNull(GraphQLFloat), description: "Year of the term. Required." },
    quarter: { type: GraphQLNonNull(GraphQLString), description: "Quarter of the term. ['Fall'|'Winter'|'Spring'|'Summer1'|'Summer2'|'Summer10wk']. Required." },
    ge: { type: GraphQLString, description: "GE type. ['ANY'|'GE-1A'|'GE-1B'|'GE-2'|'GE-3'|'GE-4'|'GE-5A'|'GE-5B'|'GE-6'|'GE-7'|'GE-8']." },
    department: { type: GraphQLString, description: "Department Code." },
    course_number: { type: GraphQLString, description: "Course number or range. Ex: '32A' or '31-33'." },
    division: { type: GraphQLString, description: "Division level of a course. ['ALL'|'LowerDiv'|'UpperDiv'|'Graduate']. Default: 'ALL'." },
    section_codes: { type: GraphQLString, description: "5-digit course code or range. Ex: '36531' or '36520-36536'." },
    instructor: { type: GraphQLString, description: "Instructor last name or part of last name." },
    course_title: { type: GraphQLString, description: "Title of a course." },
    section_type: { type: GraphQLString, description: "Type of section. ['ALL'|'ACT'|'COL'|'DIS'|'FLD'|'LAB'|'LEC'|'QIZ'|'RES'|'SEM'|'STU'|'TAP'|'TUT']. Default: 'ALL'." },
    units: { type: GraphQLString, description: "Unit count of a course. Ex: '4' or '1.3'. Use 'VAR' to look for variable unit classes." },
    days: { type: GraphQLString, description: "Days that a course is offered. Any combination of ['Su'|'M'|'T'|'W'|'Th'|'F'|'Sa']. Ex: 'MWF'." },
    start_time: { type: GraphQLString, description: "Start time of a couse in 12 hour format. Ex: '10:00AM' or '5:00PM'" },
    end_time: { type: GraphQLString, description: "End time of a couse in 12 hour format. Ex: '10:00AM' or '5:00PM'" },
    max_capacity: { type: GraphQLString, description: "Maximum enrollment capacity of a choice. Specify a " },
    full_courses: { type: GraphQLString, description: "Status of a course's enrollment state. ['ANY'|'SkipFullWaitlist'|'FullOnly'|'OverEnrolled']. Default: 'ANY'." },
    cancelled_courses: { type: GraphQLString, description: "Indicate whether to ['Exclude'|'Include'|'Only'] cancelled courses. Default: 'EXCLUDE'." },
    building: { type: GraphQLString, description: "Building code found on https://www.reg.uci.edu/addl/campus/." },
    room: { type: GraphQLString, description: "Room number in a building. Must also specify a building code." }
}

const meetingType = new GraphQLObjectType({
    name: "Meeting",
  
    fields: () => ({
      building: { 
        type: GraphQLString,
        resolve: (meeting) => {
          return meeting["bldg"];
        }
      },
      days: { type: GraphQLString },
      time: { type: GraphQLString }
    })
  })
  
  const sectionInfoType = new GraphQLObjectType({
    name: "SectionInfo",
    fields: () => ({
      code: { type: GraphQLString },
      comment: { type: GraphQLString },
      number: { type: GraphQLString },
      type: { type: GraphQLString }
    })
  })
  
  const courseOfferingType = new GraphQLObjectType({
    name: "CourseOffering",
  
    fields: () => ({
      year: { type: GraphQLString },
      quarter: { type: GraphQLString },
      final_exam: { type: GraphQLString },
      instructors: { type: GraphQLList(GraphQLString) },  // TODO: map name to professorType
      max_capacity: { type: GraphQLFloat },
      meetings: { type: GraphQLList(meetingType) },
      num_section_enrolled: { type: GraphQLFloat },
      num_total_enrolled: { type: GraphQLFloat },
      num_new_only_reserved: { type: GraphQLFloat },
      num_on_waitlist: { 
        type: GraphQLFloat, 
        resolve: (offering) => {
           return offering.num_on_waitlist === 'n/a' ? null : offering.num_on_waitlist;
          } 
      },
      num_requested: { type: GraphQLFloat },
      restrictions: { type: GraphQLString },
      section: { type: sectionInfoType },  
      status: { type: GraphQLString },
      units: { type: GraphQLFloat },
      course: { 
        type: courseType,
        resolve: (offering) => {
          return getCourse(offering.course)
        }
      }
    })
  })
  
  // Validate Schedule Query Arguments
  function validateScheduleArgs(args) {
    // Assert that a term is provided (year and quarter)
    // year and quarter are non-nullable, so they should never be false
    if (!(args.year && args.quarter)) {
      throw new ValidationError("Must provdide both a year and a quarter.");
    }
    // Assert that GE, Department, Section Codes, or Instructor is provided
    if (!(args.ge || args.department || args.section_codes || args.instructor)){
      throw new ValidationError("Must specify at least one of the following: ge, department, section_codes, or instructor.")
    }
  }
  
  // Format Schedule query arguments for WebSoc
  function scheduleArgsToQuery(args) {
    const { year, quarter, ge, department, course_number, division, section_codes, instructor, course_title, section_type, units, days, start_time, end_time, max_capacity, full_courses, cancelled_courses, building, room} = args
    return {
      term: year + " " + quarter,
      ge: ge,
      department: department,
      courseNumber: course_number,
      division: division,
      sectionCodes: section_codes,
      instructorName: instructor,
      courseTitle: course_title,
      sectionType: section_type,
      units: units,
      days: days,
      startTime: start_time,
      endTime: end_time,
      maxCapacity: max_capacity,
      fullCourses: full_courses,
      cancelledCourses: cancelled_courses,
      building: building,
      room: room,
    }
  }