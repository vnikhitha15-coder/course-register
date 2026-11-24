import { PrismaClient, Role, ExamType, AssignmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Commencing Idempotent Database Seed ---');

  // Password hashes with 12 rounds
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const studentPasswordHash = await bcrypt.hash('Student@123456', 12);

  // 1. Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {
      name: 'Dr. Evelyn Carter',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      name: 'Dr. Evelyn Carter',
      email: 'admin@university.edu',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`✓ Admin user verified: ${admin.email}`);

  // 2. Seed Students
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@university.edu' },
    update: {
      name: 'Aarav Sharma',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
    create: {
      name: 'Aarav Sharma',
      email: 'student1@university.edu',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@university.edu' },
    update: {
      name: 'Maya Lin',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
    create: {
      name: 'Maya Lin',
      email: 'student2@university.edu',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });
  console.log(`✓ Students verified: ${student1.email}, ${student2.email}`);

  // Reference date: current execution time
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 3. Seed 8 Realistic Academic Courses with session tracking and credit types
  const coursesData = [
    {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description:
        'Fundamental concepts of programming, algorithms, data structures, and computational problem solving using modern software engineering paradigms.',
      credits: 4,
      instructor: 'Prof. Alan Turing',
      capacity: 35,
      creditType: 'Core',
      term: 'Fall 2026',
      totalClasses: 30,
      completedClasses: 19,
      nextClassAt: new Date(now.getTime() + 1.5 * dayMs),
      nextClassLocation: 'Turing Hall — Lecture Theatre 101',
    },
    {
      code: 'CS204',
      title: 'Data Structures and Algorithms',
      description:
        'Rigorous exploration of abstract data types, balanced trees, graph traversal algorithms, sorting, algorithmic complexity analysis, and dynamic programming.',
      credits: 4,
      instructor: 'Dr. Grace Hopper',
      capacity: 30,
      creditType: 'Core',
      term: 'Fall 2026',
      totalClasses: 32,
      completedClasses: 20,
      nextClassAt: new Date(now.getTime() + 2 * dayMs),
      nextClassLocation: 'Hopper Building — Room 205',
    },
    {
      code: 'CS310',
      title: 'Advanced Distributed Systems',
      description:
        'Theoretical foundations and engineering practices for distributed consensus protocols, replication, fault tolerance, and event-driven microservices.',
      credits: 3,
      instructor: 'Dr. Leslie Lamport',
      capacity: 25,
      creditType: 'Elective',
      term: 'Fall 2026',
      totalClasses: 26,
      completedClasses: 14,
      nextClassAt: new Date(now.getTime() + 3 * dayMs),
      nextClassLocation: 'Franklin Science Center — Room 410',
    },
    {
      code: 'MATH201',
      title: 'Multivariable Calculus and Vector Fields',
      description:
        'Calculus of functions of several variables, partial derivatives, directional gradients, double and triple integrals, Green theorem, and Stokes theorem.',
      credits: 4,
      instructor: 'Prof. Katherine Johnson',
      capacity: 28,
      creditType: 'Core',
      term: 'Fall 2026',
      totalClasses: 28,
      completedClasses: 18,
      nextClassAt: new Date(now.getTime() + 1.2 * dayMs),
      nextClassLocation: 'Noether Mathematics Complex — Hall A',
    },
    {
      code: 'MATH240',
      title: 'Linear Algebra and Differential Equations',
      description:
        'Vector spaces, linear transformations, matrices, determinants, eigenvalues, eigenvectors, and systems of linear differential equations with applications.',
      credits: 3,
      instructor: 'Dr. Emmy Noether',
      capacity: 25,
      creditType: 'Core',
      term: 'Fall 2026',
      totalClasses: 28,
      completedClasses: 22,
      nextClassAt: new Date(now.getTime() + 0.8 * dayMs),
      nextClassLocation: 'Noether Mathematics Complex — Room 304',
    },
    {
      code: 'PHYS150',
      title: 'Classical Mechanics & Thermodynamics',
      description:
        'Comprehensive analysis of Newtonian dynamics, work-energy principles, rotational motion, gravitation, fluid dynamics, and the laws of thermodynamics.',
      credits: 4,
      instructor: 'Prof. Richard Feynman',
      capacity: 25,
      creditType: 'Lab',
      term: 'Fall 2026',
      totalClasses: 24,
      completedClasses: 14,
      nextClassAt: new Date(now.getTime() + 2.5 * dayMs),
      nextClassLocation: 'Feynman Experimental Laboratory — Bay 3',
    },
    {
      code: 'ECON101',
      title: 'Principles of Microeconomics',
      description:
        'Analytical examination of consumer choice, firm behavior, market equilibrium, pricing under competition and monopoly, externalities, and public goods.',
      credits: 3,
      instructor: 'Dr. Elinor Ostrom',
      capacity: 40,
      creditType: 'Elective',
      term: 'Fall 2026',
      totalClasses: 26,
      completedClasses: 16,
      nextClassAt: new Date(now.getTime() + 4 * dayMs),
      nextClassLocation: 'Ostrom Social Sciences — Auditorium 2',
    },
    {
      code: 'ECON215',
      title: 'Econometrics & Quantitative Analysis',
      description:
        'Statistical methods applied to economic data, ordinary least squares regression, hypothesis testing, multicollinearity, and instrumental variable estimation.',
      credits: 3,
      instructor: 'Prof. Joseph Stiglitz',
      capacity: 20,
      creditType: 'Elective',
      term: 'Fall 2026',
      totalClasses: 26,
      completedClasses: 15,
      nextClassAt: new Date(now.getTime() + 3.5 * dayMs),
      nextClassLocation: 'Stiglitz Economics Seminar Hall',
    },
  ];

  const seededCourses: Record<string, { id: string; code: string }> = {};

  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        title: c.title,
        description: c.description,
        credits: c.credits,
        instructor: c.instructor,
        capacity: c.capacity,
        creditType: c.creditType,
        term: c.term,
        totalClasses: c.totalClasses,
        completedClasses: c.completedClasses,
        nextClassAt: c.nextClassAt,
        nextClassLocation: c.nextClassLocation,
      },
      create: c,
    });
    seededCourses[c.code] = { id: course.id, code: course.code };
  }
  console.log(`✓ 8 Courses seeded/updated with session metrics`);

  // 4. Enroll student1 in 3 active courses (CS101: 4 cr, MATH240: 3 cr, PHYS150: 4 cr = 11 credits total)
  // student2 in CS310 (3 cr), ECON101 (3 cr)
  const enrollmentsToSeed = [
    { studentId: student1.id, courseId: seededCourses['CS101'].id },
    { studentId: student1.id, courseId: seededCourses['MATH240'].id },
    { studentId: student1.id, courseId: seededCourses['PHYS150'].id },
    { studentId: student2.id, courseId: seededCourses['CS310'].id },
    { studentId: student2.id, courseId: seededCourses['ECON101'].id },
  ];

  for (const enr of enrollmentsToSeed) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: enr.studentId,
          courseId: enr.courseId,
        },
      },
      update: {},
      create: {
        studentId: enr.studentId,
        courseId: enr.courseId,
      },
    });
  }
  console.log(`✓ Student course enrollments verified`);

  // 5. Seed Realistic Exams across courses
  // Clean existing exams to ensure clean seed reproduction
  await prisma.exam.deleteMany({});

  const examsData = [
    // CS101 Exams
    {
      courseId: seededCourses['CS101'].id,
      title: 'Midterm Examination: Algorithms & Control Structures',
      examType: ExamType.MIDTERM,
      startTime: new Date(now.getTime() - 15 * dayMs),
      endTime: new Date(now.getTime() - 15 * dayMs + 2 * 60 * 60 * 1000),
      location: 'Turing Hall — Auditorium 101',
      syllabusNotes: 'Modules 1-5: Asymptotic notation, recursion, and sorting algorithms.',
    },
    {
      courseId: seededCourses['CS101'].id,
      title: 'Final Comprehensive Exam: Systems & Computation',
      examType: ExamType.FINAL,
      startTime: new Date(now.getTime() + 18 * dayMs + 9 * 60 * 60 * 1000), // 18 days from now at 9am
      endTime: new Date(now.getTime() + 18 * dayMs + 12 * 60 * 60 * 1000),
      location: 'Main University Examination Centre — Hall B',
      syllabusNotes: 'Comprehensive evaluation covering all semester curriculum units.',
    },
    // MATH240 Exams
    {
      courseId: seededCourses['MATH240'].id,
      title: 'Diagnostic Quiz: Vector Spaces & Basis Transformation',
      examType: ExamType.QUIZ,
      startTime: new Date(now.getTime() - 10 * dayMs),
      endTime: new Date(now.getTime() - 10 * dayMs + 60 * 60 * 1000),
      location: 'Noether Mathematics Complex — Room 304',
      syllabusNotes: 'Linear independence, spanning sets, and coordinates.',
    },
    {
      courseId: seededCourses['MATH240'].id,
      title: 'Upcoming Assessment: Eigenvalues & Diagonalization',
      examType: ExamType.MIDTERM,
      startTime: new Date(now.getTime() + 3 * dayMs + 10 * 60 * 60 * 1000), // 3 days from now
      endTime: new Date(now.getTime() + 3 * dayMs + 12 * 60 * 60 * 1000),
      location: 'Noether Mathematics Complex — Room 304',
      syllabusNotes: 'Eigenvalues, characteristic polynomials, and matrix diagonalization.',
    },
    // PHYS150 Exams
    {
      courseId: seededCourses['PHYS150'].id,
      title: 'Midterm Lab Practical: Rotational Kinematics & Momentum',
      examType: ExamType.PRACTICAL,
      startTime: new Date(now.getTime() + 8 * dayMs + 14 * 60 * 60 * 1000), // 8 days from now
      endTime: new Date(now.getTime() + 8 * dayMs + 17 * 60 * 60 * 1000),
      location: 'Feynman Experimental Laboratory — Bay 3',
      syllabusNotes: 'Bring lab notebooks, safety goggles, and calibrated vernier calipers.',
    },
    {
      courseId: seededCourses['PHYS150'].id,
      title: 'Final Theory Exam: Thermodynamics & Field Theory',
      examType: ExamType.FINAL,
      startTime: new Date(now.getTime() + 22 * dayMs + 13 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 22 * dayMs + 16 * 60 * 60 * 1000),
      location: 'Science Auditorium East',
      syllabusNotes: 'Statistical mechanics, Carnot cycle, and kinetic gas theory.',
    },
    // CS310 Exam (for student2)
    {
      courseId: seededCourses['CS310'].id,
      title: 'Raft & Paxos Consensus Protocol Assessment',
      examType: ExamType.MIDTERM,
      startTime: new Date(now.getTime() + 5 * dayMs + 11 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * dayMs + 13 * 60 * 60 * 1000),
      location: 'Hopper Building — Room 205',
      syllabusNotes: 'Distributed state machine replication and leader election.',
    },
  ];

  for (const ex of examsData) {
    await prisma.exam.create({
      data: ex,
    });
  }
  console.log(`✓ ${examsData.length} Realistic academic exams created`);

  // 6. Seed Realistic Assignments across courses
  await prisma.assignment.deleteMany({});

  const assignmentsData = [
    // CS101 Assignments
    {
      code: 'CS101',
      title: 'Programming Project 1: Recursive Syntax Tree Parser',
      description:
        'Implement an abstract syntax tree parser in TypeScript supporting arithmetic expressions and precedence evaluation.',
      dueDate: new Date(now.getTime() - 14 * dayMs), // Past submitted
      maxPoints: 100,
      weightPercent: 10,
      student1Status: AssignmentStatus.GRADED,
      student1Score: 96,
      student1SubmittedAt: new Date(now.getTime() - 15 * dayMs),
    },
    {
      code: 'CS101',
      title: 'Homework 3: Balanced Red-Black Tree Implementation',
      description:
        'Construct insertion, deletion, and rotation routines with rigorous unit tests verifying black-height invariants.',
      dueDate: new Date(now.getTime() - 2 * dayMs), // Overdue!
      maxPoints: 100,
      weightPercent: 12,
      student1Status: AssignmentStatus.IN_PROGRESS,
      student1Score: null,
      student1SubmittedAt: null,
    },
    {
      code: 'CS101',
      title: 'Homework 4: Graph Dijkstra & A* Pathfinder',
      description:
        'Develop optimal route traversal on directed weighted graphs using priority queues and admissible heuristics.',
      dueDate: new Date(now.getTime() + 4 * dayMs), // Due soon
      maxPoints: 100,
      weightPercent: 15,
      student1Status: AssignmentStatus.PENDING,
      student1Score: null,
      student1SubmittedAt: null,
    },
    // MATH240 Assignments
    {
      code: 'MATH240',
      title: 'Problem Set 4: Orthogonal Projections & Gram-Schmidt',
      description:
        'Solve vector decomposition exercises and apply the Gram-Schmidt orthonormalization process to polynomial subspaces.',
      dueDate: new Date(now.getTime() + 2 * dayMs), // Due in 2 days
      maxPoints: 50,
      weightPercent: 8,
      student1Status: AssignmentStatus.IN_PROGRESS,
      student1Score: null,
      student1SubmittedAt: null,
    },
    {
      code: 'MATH240',
      title: 'Problem Set 5: Coupled First-Order Differential Systems',
      description:
        'Determine phase portraits, equilibrium stability, and matrix exponential solutions for nonlinear approximations.',
      dueDate: new Date(now.getTime() + 9 * dayMs), // Upcoming
      maxPoints: 50,
      weightPercent: 8,
      student1Status: AssignmentStatus.PENDING,
      student1Score: null,
      student1SubmittedAt: null,
    },
    // PHYS150 Assignments
    {
      code: 'PHYS150',
      title: 'Lab Report 2: Gyroscopic Precession & Moment of Inertia',
      description:
        'Analyze precision photogate sensor measurements and quantify systematic error bounds in flywheel deceleration.',
      dueDate: new Date(now.getTime() - 8 * dayMs), // Past submitted
      maxPoints: 100,
      weightPercent: 10,
      student1Status: AssignmentStatus.GRADED,
      student1Score: 92,
      student1SubmittedAt: new Date(now.getTime() - 9 * dayMs),
    },
    {
      code: 'PHYS150',
      title: 'Lab Report 3: Damped Harmonic Oscillations & Q-Factor',
      description:
        'Fit exponential envelope curves to acoustic resonance waveforms and compute circuit mechanical analogies.',
      dueDate: new Date(now.getTime() + 6 * dayMs), // Due soon
      maxPoints: 100,
      weightPercent: 10,
      student1Status: AssignmentStatus.PENDING,
      student1Score: null,
      student1SubmittedAt: null,
    },
    // CS310 Assignment (for student2)
    {
      code: 'CS310',
      title: 'Distributed Key-Value Store with Multi-Paxos',
      description:
        'Implement leader lease timers, log compaction snapshots, and asynchronous commit RPC handlers.',
      dueDate: new Date(now.getTime() + 7 * dayMs),
      maxPoints: 100,
      weightPercent: 20,
      student1Status: null, // Not enrolled
      student1Score: null,
      student1SubmittedAt: null,
    },
  ];

  for (const asg of assignmentsData) {
    const courseId = seededCourses[asg.code].id;
    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title: asg.title,
        description: asg.description,
        dueDate: asg.dueDate,
        maxPoints: asg.maxPoints,
        weightPercent: asg.weightPercent,
      },
    });

    // Create student1 submission if student1 is enrolled
    if (asg.student1Status) {
      await prisma.studentAssignment.create({
        data: {
          studentId: student1.id,
          assignmentId: assignment.id,
          status: asg.student1Status,
          score: asg.student1Score,
          submittedAt: asg.student1SubmittedAt,
        },
      });
    }

    // Also seed student2 on CS310 assignment
    if (asg.code === 'CS310') {
      await prisma.studentAssignment.create({
        data: {
          studentId: student2.id,
          assignmentId: assignment.id,
          status: AssignmentStatus.IN_PROGRESS,
          score: null,
          submittedAt: null,
        },
      });
    }
  }
  console.log(`✓ ${assignmentsData.length} Assignments & Student Submissions seeded`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
