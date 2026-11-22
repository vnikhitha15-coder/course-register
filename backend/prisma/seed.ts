import { PrismaClient, Role } from '@prisma/client';
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

  // 3. Seed 8 Realistic Academic Courses
  const coursesData = [
    {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamental concepts of programming, algorithms, data structures, and computational problem solving using modern software engineering paradigms.',
      credits: 4,
      instructor: 'Prof. Alan Turing',
      capacity: 35,
    },
    {
      code: 'CS204',
      title: 'Data Structures and Algorithms',
      description: 'Rigorous exploration of abstract data types, balanced trees, graph traversal algorithms, sorting, algorithmic complexity analysis, and dynamic programming.',
      credits: 4,
      instructor: 'Dr. Grace Hopper',
      capacity: 30,
    },
    {
      code: 'CS310',
      title: 'Advanced Distributed Systems',
      description: 'Theoretical foundations and engineering practices for distributed consensus protocols, replication, fault tolerance, and event-driven microservices.',
      credits: 3,
      instructor: 'Dr. Leslie Lamport',
      capacity: 2, // Intentional low capacity for testing full-course behaviors
    },
    {
      code: 'MATH201',
      title: 'Multivariable Calculus and Vector Fields',
      description: 'Calculus of functions of several variables, partial derivatives, directional gradients, double and triple integrals, Green theorem, and Stokes theorem.',
      credits: 4,
      instructor: 'Prof. Katherine Johnson',
      capacity: 28,
    },
    {
      code: 'MATH240',
      title: 'Linear Algebra and Differential Equations',
      description: 'Vector spaces, linear transformations, matrices, determinants, eigenvalues, eigenvectors, and systems of linear differential equations with applications.',
      credits: 3,
      instructor: 'Dr. Emmy Noether',
      capacity: 25,
    },
    {
      code: 'PHYS150',
      title: 'Classical Mechanics & Thermodynamics',
      description: 'Comprehensive analysis of Newtonian dynamics, work-energy principles, rotational motion, gravitation, fluid dynamics, and the laws of thermodynamics.',
      credits: 4,
      instructor: 'Prof. Richard Feynman',
      capacity: 25,
    },
    {
      code: 'ECON101',
      title: 'Principles of Microeconomics',
      description: 'Analytical examination of consumer choice, firm behavior, market equilibrium, pricing under competition and monopoly, externalities, and public goods.',
      credits: 3,
      instructor: 'Dr. Elinor Ostrom',
      capacity: 40,
    },
    {
      code: 'ECON215',
      title: 'Econometrics & Quantitative Analysis',
      description: 'Statistical methods applied to economic data, ordinary least squares regression, hypothesis testing, multicollinearity, and instrumental variable estimation.',
      credits: 3,
      instructor: 'Prof. Joseph Stiglitz',
      capacity: 20,
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
      },
      create: c,
    });
    seededCourses[c.code] = { id: course.id, code: course.code };
  }
  console.log(`✓ 8 Courses seeded/verified successfully`);

  // 4. Seed 3 Initial Enrollments (idempotent upsert on composite key)
  // student1 -> CS101, MATH240
  // student2 -> CS310
  const enrollmentsToSeed = [
    { studentId: student1.id, courseId: seededCourses['CS101'].id },
    { studentId: student1.id, courseId: seededCourses['MATH240'].id },
    { studentId: student2.id, courseId: seededCourses['CS310'].id },
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
  console.log(`✓ 3 Initial student enrollments verified`);
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
