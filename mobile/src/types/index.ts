/**
 * User Roles
 */
export enum UserRole {
    STUDENT_1ST_TO_3RD = 'student_1_3',
    STUDENT_4TH = 'student_4',
    ADMIN = 'admin',
    FACULTY = 'faculty'
}

/**
 * CCS Programs
 */
export enum AcademicProgram {
    BSIS = 'BSIS',
    BSIT = 'BSIT',
    BSCS = 'BSCS'
}

/**
 * User interface matching backend schema
 */
export interface User {
    uid: string;
    email: string;
    studentNumber: string;
    displayName: string;
    phoneNumber: string;
    role: UserRole;
    program?: AcademicProgram; // Added Program field
    yearLevel?: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Academic Study/Paper interface
 */
export interface AcademicStudy {
    _id: string;
    title: string;
    authors: string[];
    abstract: string;
    program: AcademicProgram; // Added Program field
    keywords: string[];
    category: string;
    yearPublished: number;
    uploadedBy: string;
    fileUrl: string;
    thumbnailUrl?: string;
    fullText: string;
    downloadCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bookmark interface
 */
export interface Bookmark {
    _id: string;
    userId: string;
    studyId: string;
    createdAt: Date;
}

/**
 * Reading History interface
 */
export interface ReadingHistory {
    _id: string;
    userId: string;
    studyId: string;
    lastPage: number;
    totalPages: number;
    progress: number;
    lastReadAt: Date;
}

/**
 * Navigation types
 */
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
    TwoFactor: { email: string };
    ForgotPassword: undefined;
    ForgotPasswordOTP: { email: string };
    ResetPassword: { email: string; resetToken: string };
};

export type MainTabParamList = {
    Home: undefined;
    Search: undefined;
    Library: undefined;
    Upload: undefined;
    Notifications: undefined;
};

export type HomeStackParamList = {
    Dashboard: undefined;
    StudyDetail: { studyId: string };
    PDFReader: { studyId: string };
};
