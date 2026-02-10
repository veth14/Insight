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
 * User interface matching backend schema
 */
export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
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
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Search: undefined;
    Bookmarks: undefined;
    Profile: undefined;
};

export type HomeStackParamList = {
    Dashboard: undefined;
    PDFReader: { studyId: string };
};
