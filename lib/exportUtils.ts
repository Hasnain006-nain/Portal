import * as XLSX from 'xlsx';
import { studentsApi, coursesApi, enrollmentsApi, hostelsApi, roomsApi } from './apiClient';

// Format date for Excel
const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Export Students with detailed information
export const exportStudents = async (hostels: any[]) => {
    try {
        const students = await studentsApi.getAll();
        const enrollments = await enrollmentsApi.getAll();

        const workbook = XLSX.utils.book_new();

        // Sheet 1: Students Overview
        const studentsData = students.map((student: any) => {
            const hostel = hostels.find(h => h._id === student.hostelBuilding);
            return {
                'Student ID': student.studentId,
                'Full Name': student.name,
                'Email': student.email,
                'Phone': student.phone || 'N/A',
                'Faculty': student.faculty || student.department || 'N/A',
                'Year': student.year,
                'Gender': student.gender || 'N/A',
                'Hostel': hostel?.name || 'N/A',
                'Room Number': student.roomNumber || 'N/A',
            };
        });
        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students Overview');

        // Sheet 2: Students by Faculty
        const facultyGroups: any = {};
        students.forEach((student: any) => {
            const faculty = student.faculty || student.department || 'Unassigned';
            if (!facultyGroups[faculty]) {
                facultyGroups[faculty] = [];
            }
            facultyGroups[faculty].push(student);
        });

        const facultyData: any[] = [];
        Object.keys(facultyGroups).sort().forEach(faculty => {
            facultyData.push({
                'Faculty': faculty,
                'Total Students': facultyGroups[faculty].length,
                '': ''
            });
            facultyGroups[faculty].forEach((student: any) => {
                facultyData.push({
                    'Faculty': '',
                    'Student ID': student.studentId,
                    'Name': student.name,
                    'Year': student.year,
                    'Email': student.email
                });
            });
            facultyData.push({}); // Empty row
        });
        const facultySheet = XLSX.utils.json_to_sheet(facultyData);
        XLSX.utils.book_append_sheet(workbook, facultySheet, 'Students by Faculty');

        // Sheet 3: Course Enrollments
        const enrollmentData: any[] = [];
        const courseGroups: any = {};

        enrollments.forEach((enrollment: any) => {
            if (!courseGroups[enrollment.courseCode]) {
                courseGroups[enrollment.courseCode] = {
                    courseName: enrollment.courseName,
                    instructor: enrollment.instructor,
                    students: []
                };
            }
            courseGroups[enrollment.courseCode].students.push(enrollment);
        });

        Object.keys(courseGroups).sort().forEach(courseCode => {
            const course = courseGroups[courseCode];
            enrollmentData.push({
                'Course Code': courseCode,
                'Course Name': course.courseName,
                'Instructor': course.instructor,
                'Total Enrolled': course.students.length,
                '': ''
            });

            course.students.forEach((enrollment: any) => {
                enrollmentData.push({
                    'Course Code': '',
                    'Student ID': enrollment.studentId,
                    'Student Name': enrollment.studentName,
                    'Enrollment Date': formatDate(enrollment.enrolledAt),
                    'Status': 'Active'
                });
            });
            enrollmentData.push({}); // Empty row
        });
        const enrollmentSheet = XLSX.utils.json_to_sheet(enrollmentData);
        XLSX.utils.book_append_sheet(workbook, enrollmentSheet, 'Course Enrollments');

        // Download
        XLSX.writeFile(workbook, `Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

// Export Hostels with detailed information
export const exportHostels = async () => {
    try {
        const hostels = await hostelsApi.getAll();
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Hostels Overview
        const hostelsData = hostels.map((hostel: any) => ({
            'Hostel Name': hostel.name,
            'Total Floors': hostel.floors,
            'Total Rooms': hostel.totalRooms,
            'Total Capacity': hostel.capacity,
            'Current Occupancy': hostel.occupancy || 0,
            'Available Spots': hostel.capacity - (hostel.occupancy || 0),
            'Occupancy Rate': `${Math.round(((hostel.occupancy || 0) / hostel.capacity) * 100)}%`,
            'Gender': hostel.gender || 'Mixed',
            'Warden': hostel.warden || 'N/A',
            'Contact': hostel.contact || 'N/A'
        }));
        const hostelsSheet = XLSX.utils.json_to_sheet(hostelsData);
        XLSX.utils.book_append_sheet(workbook, hostelsSheet, 'Hostels Overview');

        // Sheet 2: Detailed Room Information
        for (const hostel of hostels) {
            const rooms = await roomsApi.getByHostelId(hostel._id);
            const roomData: any[] = [];

            rooms.forEach((room: any) => {
                const residents = room.residents || [];
                roomData.push({
                    'Room Number': room.roomNumber,
                    'Floor': room.floor,
                    'Capacity': room.capacity,
                    'Occupied': residents.length,
                    'Available': room.capacity - residents.length,
                    'Status': residents.length >= room.capacity ? 'Full' : 'Available',
                    '': ''
                });

                if (residents.length > 0) {
                    residents.forEach((resident: any) => {
                        roomData.push({
                            'Room Number': '',
                            'Student ID': resident.studentId,
                            'Name': resident.name,
                            'Email': resident.email,
                            'Phone': resident.phone || 'N/A'
                        });
                    });
                }
                roomData.push({}); // Empty row
            });

            const roomSheet = XLSX.utils.json_to_sheet(roomData);
            const sheetName = hostel.name.substring(0, 31); // Excel sheet name limit
            XLSX.utils.book_append_sheet(workbook, roomSheet, sheetName);
        }

        // Download
        XLSX.writeFile(workbook, `Hostels_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

// Export Library/Books with detailed information
export const exportLibrary = async (books: any[], borrowRecords: any[]) => {
    try {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Books Inventory
        const booksData = books.map((book: any) => ({
            'Book ID': book.bookId || book._id,
            'Title': book.title,
            'Author': book.author,
            'ISBN': book.isbn || 'N/A',
            'Category': book.category || 'General',
            'Publisher': book.publisher || 'N/A',
            'Publication Year': book.publicationYear || 'N/A',
            'Total Copies': book.totalCopies || 1,
            'Available Copies': book.availableCopies || 0,
            'Borrowed Copies': (book.totalCopies || 1) - (book.availableCopies || 0),
            'Status': (book.availableCopies || 0) > 0 ? 'Available' : 'All Borrowed',
            'Location/Shelf': book.location || 'N/A'
        }));
        const booksSheet = XLSX.utils.json_to_sheet(booksData);
        XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books Inventory');

        // Sheet 2: Books by Category
        const categoryGroups: any = {};
        books.forEach((book: any) => {
            const category = book.category || 'Uncategorized';
            if (!categoryGroups[category]) {
                categoryGroups[category] = [];
            }
            categoryGroups[category].push(book);
        });

        const categoryData: any[] = [];
        Object.keys(categoryGroups).sort().forEach(category => {
            categoryData.push({
                'Category': category,
                'Total Books': categoryGroups[category].length,
                'Total Copies': categoryGroups[category].reduce((sum: number, b: any) => sum + (b.totalCopies || 1), 0),
                '': ''
            });
            categoryGroups[category].forEach((book: any) => {
                categoryData.push({
                    'Category': '',
                    'Title': book.title,
                    'Author': book.author,
                    'Copies': book.totalCopies || 1,
                    'Available': book.availableCopies || 0
                });
            });
            categoryData.push({}); // Empty row
        });
        const categorySheet = XLSX.utils.json_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Books by Category');

        // Sheet 3: Current Borrowed Books
        const currentBorrowed = borrowRecords.filter((record: any) =>
            record.status === 'borrowed' || !record.returnedAt
        );
        const borrowedData = currentBorrowed.map((record: any) => ({
            'Student ID': record.studentId,
            'Student Name': record.studentName,
            'Book Title': record.bookTitle,
            'Author': record.author || 'N/A',
            'Borrowed Date': formatDate(record.borrowedAt),
            'Due Date': formatDate(record.dueDate),
            'Days Borrowed': Math.floor((new Date().getTime() - new Date(record.borrowedAt).getTime()) / (1000 * 60 * 60 * 24)),
            'Status': new Date(record.dueDate) < new Date() ? 'OVERDUE' : 'Active',
            'Fine': record.fine || 0
        }));
        const borrowedSheet = XLSX.utils.json_to_sheet(borrowedData);
        XLSX.utils.book_append_sheet(workbook, borrowedSheet, 'Currently Borrowed');

        // Sheet 4: Borrow History
        const historyData = borrowRecords.map((record: any) => ({
            'Transaction ID': record._id,
            'Student ID': record.studentId,
            'Student Name': record.studentName,
            'Book Title': record.bookTitle,
            'Author': record.author || 'N/A',
            'Borrowed Date': formatDate(record.borrowedAt),
            'Due Date': formatDate(record.dueDate),
            'Return Date': record.returnedAt ? formatDate(record.returnedAt) : 'Not Returned',
            'Status': record.status || (record.returnedAt ? 'Returned' : 'Borrowed'),
            'Days Kept': record.returnedAt
                ? Math.floor((new Date(record.returnedAt).getTime() - new Date(record.borrowedAt).getTime()) / (1000 * 60 * 60 * 24))
                : Math.floor((new Date().getTime() - new Date(record.borrowedAt).getTime()) / (1000 * 60 * 60 * 24)),
            'Fine': record.fine || 0
        }));
        const historySheet = XLSX.utils.json_to_sheet(historyData);
        XLSX.utils.book_append_sheet(workbook, historySheet, 'Borrow History');

        // Sheet 5: Library Statistics
        const totalBooks = books.length;
        const totalCopies = books.reduce((sum: number, b: any) => sum + (b.totalCopies || 1), 0);
        const totalBorrowed = currentBorrowed.length;
        const totalOverdue = currentBorrowed.filter((r: any) => new Date(r.dueDate) < new Date()).length;

        const statsData = [
            { 'Metric': 'Total Unique Books', 'Value': totalBooks },
            { 'Metric': 'Total Book Copies', 'Value': totalCopies },
            { 'Metric': 'Currently Borrowed', 'Value': totalBorrowed },
            { 'Metric': 'Overdue Books', 'Value': totalOverdue },
            { 'Metric': 'Total Transactions', 'Value': borrowRecords.length },
            { 'Metric': 'Categories', 'Value': Object.keys(categoryGroups).length }
        ];
        const statsSheet = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

        // Download
        XLSX.writeFile(workbook, `Library_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

// Export Courses with detailed information
export const exportCourses = async () => {
    try {
        const courses = await coursesApi.getAll();
        const enrollments = await enrollmentsApi.getAll();
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Courses Overview
        const coursesData = courses.map((course: any) => {
            const courseEnrollments = enrollments.filter((e: any) => e.courseCode === course.courseCode);
            return {
                'Course Code': course.courseCode,
                'Course Name': course.courseName,
                'Instructor': course.instructor,
                'Department': course.department || 'N/A',
                'Credits': course.credits || 'N/A',
                'Semester': course.semester || 'N/A',
                'Total Enrolled': courseEnrollments.length,
                'Capacity': course.capacity || 'N/A',
                'Available Spots': course.capacity ? course.capacity - courseEnrollments.length : 'N/A',
                'Schedule': course.schedule || 'N/A',
                'Room': course.room || 'N/A'
            };
        });
        const coursesSheet = XLSX.utils.json_to_sheet(coursesData);
        XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses Overview');

        // Sheet 2: Detailed Enrollments by Course
        const enrollmentData: any[] = [];
        courses.forEach((course: any) => {
            const courseEnrollments = enrollments.filter((e: any) => e.courseCode === course.courseCode);

            enrollmentData.push({
                'Course Code': course.courseCode,
                'Course Name': course.courseName,
                'Instructor': course.instructor,
                'Total Enrolled': courseEnrollments.length,
                '': ''
            });

            if (courseEnrollments.length > 0) {
                courseEnrollments.forEach((enrollment: any) => {
                    enrollmentData.push({
                        'Course Code': '',
                        'Student ID': enrollment.studentId,
                        'Student Name': enrollment.studentName,
                        'Enrollment Date': formatDate(enrollment.enrolledAt),
                        'Status': 'Active'
                    });
                });
            } else {
                enrollmentData.push({
                    'Course Code': '',
                    'Message': 'No students enrolled yet'
                });
            }
            enrollmentData.push({}); // Empty row
        });
        const detailedSheet = XLSX.utils.json_to_sheet(enrollmentData);
        XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Enrollments by Course');

        // Download
        XLSX.writeFile(workbook, `Courses_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

// Export Requests with detailed information
export const exportRequests = async (requests: any[]) => {
    try {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: All Requests Overview
        const requestsData = requests.map((request: any) => ({
            'Request ID': request._id,
            'Type': request.type.toUpperCase(),
            'Status': request.status.toUpperCase(),
            'Student Name': request.studentName,
            'Student Email': request.studentEmail,
            'Item': request.type === 'enroll' ? request.courseName :
                request.type === 'new_user' ? 'New User Registration' :
                    request.bookTitle || 'N/A',
            'Details': request.type === 'enroll' ? request.courseCode :
                request.type === 'new_user' ? request.message :
                    request.bookAuthor || 'N/A',
            'Requested Date': formatDate(request.requestedAt || request.createdAt),
            'Processed Date': request.processedAt ? formatDate(request.processedAt) : 'Not Processed',
            'Admin Note': request.adminNote || 'N/A'
        }));
        const requestsSheet = XLSX.utils.json_to_sheet(requestsData);
        XLSX.utils.book_append_sheet(workbook, requestsSheet, 'All Requests');

        // Sheet 2: Pending Requests
        const pendingRequests = requests.filter(r => r.status === 'pending');
        const pendingData = pendingRequests.map((request: any) => ({
            'Type': request.type.toUpperCase(),
            'Student Name': request.studentName,
            'Student Email': request.studentEmail,
            'Item': request.type === 'enroll' ? request.courseName :
                request.type === 'new_user' ? 'New User Registration' :
                    request.bookTitle || 'N/A',
            'Requested Date': formatDate(request.requestedAt || request.createdAt),
            'Days Pending': Math.floor((new Date().getTime() - new Date(request.requestedAt || request.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }));
        const pendingSheet = XLSX.utils.json_to_sheet(pendingData);
        XLSX.utils.book_append_sheet(workbook, pendingSheet, 'Pending Requests');

        // Sheet 3: Requests by Type
        const typeGroups: any = {
            'borrow': requests.filter(r => r.type === 'borrow'),
            'return': requests.filter(r => r.type === 'return'),
            'enroll': requests.filter(r => r.type === 'enroll'),
            'new_user': requests.filter(r => r.type === 'new_user')
        };

        const typeData: any[] = [];
        Object.keys(typeGroups).forEach(type => {
            const typeRequests = typeGroups[type];
            typeData.push({
                'Request Type': type.toUpperCase(),
                'Total': typeRequests.length,
                'Pending': typeRequests.filter((r: any) => r.status === 'pending').length,
                'Approved': typeRequests.filter((r: any) => r.status === 'approved').length,
                'Rejected': typeRequests.filter((r: any) => r.status === 'rejected').length,
                '': ''
            });

            typeRequests.forEach((request: any) => {
                typeData.push({
                    'Request Type': '',
                    'Student': request.studentName,
                    'Item': request.type === 'enroll' ? request.courseName :
                        request.type === 'new_user' ? 'Registration' :
                            request.bookTitle || 'N/A',
                    'Status': request.status.toUpperCase(),
                    'Date': formatDate(request.requestedAt || request.createdAt)
                });
            });
            typeData.push({}); // Empty row
        });
        const typeSheet = XLSX.utils.json_to_sheet(typeData);
        XLSX.utils.book_append_sheet(workbook, typeSheet, 'Requests by Type');

        // Sheet 4: Statistics
        const statsData = [
            { 'Metric': 'Total Requests', 'Value': requests.length },
            { 'Metric': 'Pending Requests', 'Value': requests.filter(r => r.status === 'pending').length },
            { 'Metric': 'Approved Requests', 'Value': requests.filter(r => r.status === 'approved').length },
            { 'Metric': 'Rejected Requests', 'Value': requests.filter(r => r.status === 'rejected').length },
            { 'Metric': 'Borrow Requests', 'Value': typeGroups.borrow.length },
            { 'Metric': 'Return Requests', 'Value': typeGroups.return.length },
            { 'Metric': 'Enrollment Requests', 'Value': typeGroups.enroll.length },
            { 'Metric': 'New User Registrations', 'Value': typeGroups.new_user.length }
        ];
        const statsSheet = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

        // Download
        XLSX.writeFile(workbook, `Requests_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

// Export All Data (Complete System Export)
export const exportAllData = async (hostels: any[], books: any[], borrowRecords: any[]) => {
    try {
        const students = await studentsApi.getAll();
        const courses = await coursesApi.getAll();
        const enrollments = await enrollmentsApi.getAll();

        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            { 'Category': 'Students', 'Total': students.length },
            { 'Category': 'Courses', 'Total': courses.length },
            { 'Category': 'Enrollments', 'Total': enrollments.length },
            { 'Category': 'Hostels', 'Total': hostels.length },
            { 'Category': 'Books', 'Total': books.length },
            { 'Category': 'Borrow Records', 'Total': borrowRecords.length }
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Add all other sheets (simplified versions)
        const studentsSheet = XLSX.utils.json_to_sheet(students.map((s: any) => ({
            'ID': s.studentId,
            'Name': s.name,
            'Email': s.email,
            'Faculty': s.faculty || s.department,
            'Year': s.year
        })));
        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

        const coursesSheet = XLSX.utils.json_to_sheet(courses.map((c: any) => ({
            'Code': c.courseCode,
            'Name': c.courseName,
            'Instructor': c.instructor,
            'Department': c.department
        })));
        XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses');

        const hostelsSheet = XLSX.utils.json_to_sheet(hostels.map((h: any) => ({
            'Name': h.name,
            'Floors': h.floors,
            'Capacity': h.capacity,
            'Occupancy': h.occupancy || 0
        })));
        XLSX.utils.book_append_sheet(workbook, hostelsSheet, 'Hostels');

        const booksSheet = XLSX.utils.json_to_sheet(books.map((b: any) => ({
            'Title': b.title,
            'Author': b.author,
            'Category': b.category,
            'Available': b.availableCopies
        })));
        XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

        // Download
        XLSX.writeFile(workbook, `Complete_System_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};
