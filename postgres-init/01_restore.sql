--
-- PostgreSQL database dump
--

\restrict lLNgsMXNmaqkOnd4QrTrYwgxAWdgHfypyuDzLsLEw8lSFyofPWO941ZSaWG6B3g

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public."WorkExperience" DROP CONSTRAINT "WorkExperience_userId_fkey";
ALTER TABLE ONLY public."WFHLocation" DROP CONSTRAINT "WFHLocation_userId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_roleId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_organizationId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_managerId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_departmentId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_bandId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_assignedOfficeId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_teamId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_slaId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_requesterId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_problemId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_ciId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_changeRequestId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_categoryId_fkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_assigneeId_fkey";
ALTER TABLE ONLY public."TicketComment" DROP CONSTRAINT "TicketComment_ticketId_fkey";
ALTER TABLE ONLY public."TicketCategoryModel" DROP CONSTRAINT "TicketCategoryModel_teamId_fkey";
ALTER TABLE ONLY public."TicketActivity" DROP CONSTRAINT "TicketActivity_ticketId_fkey";
ALTER TABLE ONLY public."TeamBudget" DROP CONSTRAINT "TeamBudget_cycleId_fkey";
ALTER TABLE ONLY public."Skill" DROP CONSTRAINT "Skill_userId_fkey";
ALTER TABLE ONLY public."ServiceDeskMember" DROP CONSTRAINT "ServiceDeskMember_teamId_fkey";
ALTER TABLE ONLY public."SalaryStructure" DROP CONSTRAINT "SalaryStructure_userId_fkey";
ALTER TABLE ONLY public."Roster" DROP CONSTRAINT "Roster_userId_fkey";
ALTER TABLE ONLY public."Roster" DROP CONSTRAINT "Roster_shiftId_fkey";
ALTER TABLE ONLY public."Role" DROP CONSTRAINT "Role_organizationId_fkey";
ALTER TABLE ONLY public."Problem" DROP CONSTRAINT "Problem_categoryId_fkey";
ALTER TABLE ONLY public."Problem" DROP CONSTRAINT "Problem_assignmentGroupId_fkey";
ALTER TABLE ONLY public."ProblemActivity" DROP CONSTRAINT "ProblemActivity_problemId_fkey";
ALTER TABLE ONLY public."ProblemActivity" DROP CONSTRAINT "ProblemActivity_actorId_fkey";
ALTER TABLE ONLY public."Performance" DROP CONSTRAINT "Performance_userId_fkey";
ALTER TABLE ONLY public."Performance" DROP CONSTRAINT "Performance_reviewerId_fkey";
ALTER TABLE ONLY public."Payroll" DROP CONSTRAINT "Payroll_userId_fkey";
ALTER TABLE ONLY public."PayrollRecord" DROP CONSTRAINT "PayrollRecord_userId_fkey";
ALTER TABLE ONLY public."Office" DROP CONSTRAINT "Office_organizationId_fkey";
ALTER TABLE ONLY public."OfficeVisitRequest" DROP CONSTRAINT "OfficeVisitRequest_userId_fkey";
ALTER TABLE ONLY public."OfficeVisitRequest" DROP CONSTRAINT "OfficeVisitRequest_targetOfficeId_fkey";
ALTER TABLE ONLY public."OfficeVisitRequest" DROP CONSTRAINT "OfficeVisitRequest_managerId_fkey";
ALTER TABLE ONLY public."Offer" DROP CONSTRAINT "Offer_applicationId_fkey";
ALTER TABLE ONLY public."OffboardingRequest" DROP CONSTRAINT "OffboardingRequest_userId_fkey";
ALTER TABLE ONLY public."Message" DROP CONSTRAINT "Message_senderId_fkey";
ALTER TABLE ONLY public."Message" DROP CONSTRAINT "Message_conversationId_fkey";
ALTER TABLE ONLY public."MessageReadStatus" DROP CONSTRAINT "MessageReadStatus_userId_fkey";
ALTER TABLE ONLY public."MessageReadStatus" DROP CONSTRAINT "MessageReadStatus_messageId_fkey";
ALTER TABLE ONLY public."Leave" DROP CONSTRAINT "Leave_userId_fkey";
ALTER TABLE ONLY public."LeavePolicy" DROP CONSTRAINT "LeavePolicy_organizationId_fkey";
ALTER TABLE ONLY public."LeaveBalance" DROP CONSTRAINT "LeaveBalance_userId_fkey";
ALTER TABLE ONLY public."KEDBEntry" DROP CONSTRAINT "KEDBEntry_problemId_fkey";
ALTER TABLE ONLY public."JobPosting" DROP CONSTRAINT "JobPosting_departmentId_fkey";
ALTER TABLE ONLY public."Interview" DROP CONSTRAINT "Interview_interviewerId_fkey";
ALTER TABLE ONLY public."Interview" DROP CONSTRAINT "Interview_applicationId_fkey";
ALTER TABLE ONLY public."Holiday" DROP CONSTRAINT "Holiday_organizationId_fkey";
ALTER TABLE ONLY public."Document" DROP CONSTRAINT "Document_workExperienceId_fkey";
ALTER TABLE ONLY public."Document" DROP CONSTRAINT "Document_userId_fkey";
ALTER TABLE ONLY public."Department" DROP CONSTRAINT "Department_organizationId_fkey";
ALTER TABLE ONLY public."ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_userId_fkey";
ALTER TABLE ONLY public."ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_conversationId_fkey";
ALTER TABLE ONLY public."ChangeRequest" DROP CONSTRAINT "ChangeRequest_implementerId_fkey";
ALTER TABLE ONLY public."ChangeRequest" DROP CONSTRAINT "ChangeRequest_assignmentGroupId_fkey";
ALTER TABLE ONLY public."ChangeRequestCI" DROP CONSTRAINT "ChangeRequestCI_ciId_fkey";
ALTER TABLE ONLY public."ChangeRequestCI" DROP CONSTRAINT "ChangeRequestCI_changeRequestId_fkey";
ALTER TABLE ONLY public."ChangeComment" DROP CONSTRAINT "ChangeComment_changeRequestId_fkey";
ALTER TABLE ONLY public."ChangeApproval" DROP CONSTRAINT "ChangeApproval_changeRequestId_fkey";
ALTER TABLE ONLY public."ChangeApproval" DROP CONSTRAINT "ChangeApproval_approverId_fkey";
ALTER TABLE ONLY public."ChangeActivity" DROP CONSTRAINT "ChangeActivity_changeRequestId_fkey";
ALTER TABLE ONLY public."Certification" DROP CONSTRAINT "Certification_userId_fkey";
ALTER TABLE ONLY public."CMDBRelationship" DROP CONSTRAINT "CMDBRelationship_targetId_fkey";
ALTER TABLE ONLY public."CMDBRelationship" DROP CONSTRAINT "CMDBRelationship_sourceId_fkey";
ALTER TABLE ONLY public."Band" DROP CONSTRAINT "Band_organizationId_fkey";
ALTER TABLE ONLY public."Attendance" DROP CONSTRAINT "Attendance_userId_fkey";
ALTER TABLE ONLY public."Attendance" DROP CONSTRAINT "Attendance_officeId_fkey";
ALTER TABLE ONLY public."Asset" DROP CONSTRAINT "Asset_organizationId_fkey";
ALTER TABLE ONLY public."Asset" DROP CONSTRAINT "Asset_officeId_fkey";
ALTER TABLE ONLY public."Asset" DROP CONSTRAINT "Asset_assignedToId_fkey";
ALTER TABLE ONLY public."Assessment" DROP CONSTRAINT "Assessment_applicationId_fkey";
ALTER TABLE ONLY public."AppraisalReview" DROP CONSTRAINT "AppraisalReview_userId_fkey";
ALTER TABLE ONLY public."AppraisalReview" DROP CONSTRAINT "AppraisalReview_managerId_fkey";
ALTER TABLE ONLY public."AppraisalReview" DROP CONSTRAINT "AppraisalReview_cycleId_fkey";
ALTER TABLE ONLY public."AppraisalGoal" DROP CONSTRAINT "AppraisalGoal_userId_fkey";
ALTER TABLE ONLY public."AppraisalGoal" DROP CONSTRAINT "AppraisalGoal_setById_fkey";
ALTER TABLE ONLY public."AppraisalGoal" DROP CONSTRAINT "AppraisalGoal_cycleId_fkey";
ALTER TABLE ONLY public."Application" DROP CONSTRAINT "Application_jobId_fkey";
ALTER TABLE ONLY public."Application" DROP CONSTRAINT "Application_candidateId_fkey";
DROP INDEX public."User_employeeId_key";
DROP INDEX public."User_email_key";
DROP INDEX public."Ticket_ticketNumber_key";
DROP INDEX public."TicketCategoryModel_name_organizationId_key";
DROP INDEX public."ServiceDeskTeam_name_organizationId_key";
DROP INDEX public."ServiceDeskMember_teamId_userId_key";
DROP INDEX public."ServiceDeskCounter_prefix_key";
DROP INDEX public."SalaryStructure_userId_key";
DROP INDEX public."Roster_userId_date_key";
DROP INDEX public."Role_name_organizationId_key";
DROP INDEX public."Problem_problemNumber_key";
DROP INDEX public."PayrollRecord_userId_month_year_key";
DROP INDEX public."Organization_ownerId_key";
DROP INDEX public."MessageReadStatus_messageId_userId_key";
DROP INDEX public."LeavePolicy_organizationId_key";
DROP INDEX public."LeaveBalance_userId_key";
DROP INDEX public."KEDBEntry_problemId_key";
DROP INDEX public."ConversationParticipant_conversationId_userId_key";
DROP INDEX public."ChangeRequest_changeNumber_key";
DROP INDEX public."ChangeRequestCI_changeRequestId_ciId_key";
DROP INDEX public."ChangeApproval_changeRequestId_approverId_key";
DROP INDEX public."Candidate_email_key";
DROP INDEX public."CMDBRelationship_sourceId_targetId_relationshipType_key";
DROP INDEX public."CMDBItem_ciNumber_key";
DROP INDEX public."Band_name_organizationId_key";
DROP INDEX public."Asset_serialNumber_key";
DROP INDEX public."Asset_assetId_key";
DROP INDEX public."AppraisalReview_cycleId_userId_key";
DROP INDEX public."AppraisalCycle_quarter_year_key";
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
ALTER TABLE ONLY public."WorkExperience" DROP CONSTRAINT "WorkExperience_pkey";
ALTER TABLE ONLY public."WFHLocation" DROP CONSTRAINT "WFHLocation_pkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
ALTER TABLE ONLY public."Ticket" DROP CONSTRAINT "Ticket_pkey";
ALTER TABLE ONLY public."TicketComment" DROP CONSTRAINT "TicketComment_pkey";
ALTER TABLE ONLY public."TicketCategoryModel" DROP CONSTRAINT "TicketCategoryModel_pkey";
ALTER TABLE ONLY public."TicketActivity" DROP CONSTRAINT "TicketActivity_pkey";
ALTER TABLE ONLY public."TeamBudget" DROP CONSTRAINT "TeamBudget_pkey";
ALTER TABLE ONLY public."TeamBudget" DROP CONSTRAINT "TeamBudget_cycleId_managerId_key";
ALTER TABLE ONLY public."Skill" DROP CONSTRAINT "Skill_pkey";
ALTER TABLE ONLY public."Shift" DROP CONSTRAINT "Shift_pkey";
ALTER TABLE ONLY public."ServiceDeskTeam" DROP CONSTRAINT "ServiceDeskTeam_pkey";
ALTER TABLE ONLY public."ServiceDeskMember" DROP CONSTRAINT "ServiceDeskMember_pkey";
ALTER TABLE ONLY public."ServiceDeskCounter" DROP CONSTRAINT "ServiceDeskCounter_pkey";
ALTER TABLE ONLY public."SalaryStructure" DROP CONSTRAINT "SalaryStructure_pkey";
ALTER TABLE ONLY public."SLAPolicy" DROP CONSTRAINT "SLAPolicy_pkey";
ALTER TABLE ONLY public."Roster" DROP CONSTRAINT "Roster_pkey";
ALTER TABLE ONLY public."Role" DROP CONSTRAINT "Role_pkey";
ALTER TABLE ONLY public."Problem" DROP CONSTRAINT "Problem_pkey";
ALTER TABLE ONLY public."ProblemActivity" DROP CONSTRAINT "ProblemActivity_pkey";
ALTER TABLE ONLY public."Performance" DROP CONSTRAINT "Performance_pkey";
ALTER TABLE ONLY public."Payroll" DROP CONSTRAINT "Payroll_pkey";
ALTER TABLE ONLY public."PayrollRecord" DROP CONSTRAINT "PayrollRecord_pkey";
ALTER TABLE ONLY public."Organization" DROP CONSTRAINT "Organization_pkey";
ALTER TABLE ONLY public."Office" DROP CONSTRAINT "Office_pkey";
ALTER TABLE ONLY public."OfficeVisitRequest" DROP CONSTRAINT "OfficeVisitRequest_pkey";
ALTER TABLE ONLY public."Offer" DROP CONSTRAINT "Offer_pkey";
ALTER TABLE ONLY public."OffboardingRequest" DROP CONSTRAINT "OffboardingRequest_userId_key";
ALTER TABLE ONLY public."OffboardingRequest" DROP CONSTRAINT "OffboardingRequest_pkey";
ALTER TABLE ONLY public."Message" DROP CONSTRAINT "Message_pkey";
ALTER TABLE ONLY public."MessageReadStatus" DROP CONSTRAINT "MessageReadStatus_pkey";
ALTER TABLE ONLY public."Leave" DROP CONSTRAINT "Leave_pkey";
ALTER TABLE ONLY public."LeavePolicy" DROP CONSTRAINT "LeavePolicy_pkey";
ALTER TABLE ONLY public."LeaveBalance" DROP CONSTRAINT "LeaveBalance_pkey";
ALTER TABLE ONLY public."KEDBEntry" DROP CONSTRAINT "KEDBEntry_pkey";
ALTER TABLE ONLY public."JobPosting" DROP CONSTRAINT "JobPosting_pkey";
ALTER TABLE ONLY public."Interview" DROP CONSTRAINT "Interview_pkey";
ALTER TABLE ONLY public."Holiday" DROP CONSTRAINT "Holiday_pkey";
ALTER TABLE ONLY public."HikeAllocation" DROP CONSTRAINT "HikeAllocation_pkey";
ALTER TABLE ONLY public."HikeAllocation" DROP CONSTRAINT "HikeAllocation_cycleId_userId_key";
ALTER TABLE ONLY public."Document" DROP CONSTRAINT "Document_pkey";
ALTER TABLE ONLY public."Department" DROP CONSTRAINT "Department_pkey";
ALTER TABLE ONLY public."Department" DROP CONSTRAINT "Department_name_organizationId_key";
ALTER TABLE ONLY public."Conversation" DROP CONSTRAINT "Conversation_pkey";
ALTER TABLE ONLY public."ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_pkey";
ALTER TABLE ONLY public."ChangeRequest" DROP CONSTRAINT "ChangeRequest_pkey";
ALTER TABLE ONLY public."ChangeRequestCI" DROP CONSTRAINT "ChangeRequestCI_pkey";
ALTER TABLE ONLY public."ChangeComment" DROP CONSTRAINT "ChangeComment_pkey";
ALTER TABLE ONLY public."ChangeApproval" DROP CONSTRAINT "ChangeApproval_pkey";
ALTER TABLE ONLY public."ChangeActivity" DROP CONSTRAINT "ChangeActivity_pkey";
ALTER TABLE ONLY public."Certification" DROP CONSTRAINT "Certification_pkey";
ALTER TABLE ONLY public."Candidate" DROP CONSTRAINT "Candidate_pkey";
ALTER TABLE ONLY public."CMDBRelationship" DROP CONSTRAINT "CMDBRelationship_pkey";
ALTER TABLE ONLY public."CMDBItem" DROP CONSTRAINT "CMDBItem_pkey";
ALTER TABLE ONLY public."Band" DROP CONSTRAINT "Band_pkey";
ALTER TABLE ONLY public."Attendance" DROP CONSTRAINT "Attendance_pkey";
ALTER TABLE ONLY public."Asset" DROP CONSTRAINT "Asset_pkey";
ALTER TABLE ONLY public."Assessment" DROP CONSTRAINT "Assessment_pkey";
ALTER TABLE ONLY public."AppraisalReview" DROP CONSTRAINT "AppraisalReview_pkey";
ALTER TABLE ONLY public."AppraisalGoal" DROP CONSTRAINT "AppraisalGoal_pkey";
ALTER TABLE ONLY public."AppraisalCycle" DROP CONSTRAINT "AppraisalCycle_pkey";
ALTER TABLE ONLY public."Application" DROP CONSTRAINT "Application_pkey";
DROP TABLE public._prisma_migrations;
DROP TABLE public."WorkExperience";
DROP TABLE public."WFHLocation";
DROP TABLE public."User";
DROP TABLE public."TicketComment";
DROP TABLE public."TicketCategoryModel";
DROP TABLE public."TicketActivity";
DROP TABLE public."Ticket";
DROP TABLE public."TeamBudget";
DROP TABLE public."Skill";
DROP TABLE public."Shift";
DROP TABLE public."ServiceDeskTeam";
DROP TABLE public."ServiceDeskMember";
DROP TABLE public."ServiceDeskCounter";
DROP TABLE public."SalaryStructure";
DROP TABLE public."SLAPolicy";
DROP TABLE public."Roster";
DROP TABLE public."Role";
DROP TABLE public."ProblemActivity";
DROP TABLE public."Problem";
DROP TABLE public."Performance";
DROP TABLE public."PayrollRecord";
DROP TABLE public."Payroll";
DROP TABLE public."Organization";
DROP TABLE public."OfficeVisitRequest";
DROP TABLE public."Office";
DROP TABLE public."Offer";
DROP TABLE public."OffboardingRequest";
DROP TABLE public."MessageReadStatus";
DROP TABLE public."Message";
DROP TABLE public."LeavePolicy";
DROP TABLE public."LeaveBalance";
DROP TABLE public."Leave";
DROP TABLE public."KEDBEntry";
DROP TABLE public."JobPosting";
DROP TABLE public."Interview";
DROP TABLE public."Holiday";
DROP TABLE public."HikeAllocation";
DROP TABLE public."Document";
DROP TABLE public."Department";
DROP TABLE public."ConversationParticipant";
DROP TABLE public."Conversation";
DROP TABLE public."ChangeRequestCI";
DROP TABLE public."ChangeRequest";
DROP TABLE public."ChangeComment";
DROP TABLE public."ChangeApproval";
DROP TABLE public."ChangeActivity";
DROP TABLE public."Certification";
DROP TABLE public."Candidate";
DROP TABLE public."CMDBRelationship";
DROP TABLE public."CMDBItem";
DROP TABLE public."Band";
DROP TABLE public."Attendance";
DROP TABLE public."Asset";
DROP TABLE public."Assessment";
DROP TABLE public."AppraisalReview";
DROP TABLE public."AppraisalGoal";
DROP TABLE public."AppraisalCycle";
DROP TABLE public."Application";
DROP TYPE public."WorkLocation";
DROP TYPE public."TicketType";
DROP TYPE public."TicketStatus";
DROP TYPE public."TicketPriority";
DROP TYPE public."RoleType";
DROP TYPE public."ReviewStatus";
DROP TYPE public."RequestStatus";
DROP TYPE public."ProblemStatus";
DROP TYPE public."OfferStatus";
DROP TYPE public."MessageType";
DROP TYPE public."LegacyRole";
DROP TYPE public."LeaveType";
DROP TYPE public."LeaveStatus";
DROP TYPE public."JobStatus";
DROP TYPE public."InterviewStatus";
DROP TYPE public."HolidayType";
DROP TYPE public."GoalStatus";
DROP TYPE public."DocumentType";
DROP TYPE public."DocType";
DROP TYPE public."ConversationType";
DROP TYPE public."ChangeUrgency";
DROP TYPE public."ChangeType";
DROP TYPE public."ChangeStatus";
DROP TYPE public."ChangeRisk";
DROP TYPE public."ChangeImpact";
DROP TYPE public."CMDBRelationshipType";
DROP TYPE public."CMDBItemType";
DROP TYPE public."CMDBItemStatus";
DROP TYPE public."CMDBEnvironment";
DROP TYPE public."AttendanceType";
DROP TYPE public."AttendanceStatus";
DROP TYPE public."AssetStatus";
DROP TYPE public."AssetCategory";
DROP TYPE public."AssessmentType";
DROP TYPE public."ApprovalStatus";
DROP TYPE public."AppraisalStatus";
DROP TYPE public."ApplicationStatus";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO "user";

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'APPLIED',
    'SCREENING',
    'ASSESSMENT',
    'INTERVIEW',
    'OFFER',
    'HIRED',
    'REJECTED'
);


ALTER TYPE public."ApplicationStatus" OWNER TO "user";

--
-- Name: AppraisalStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AppraisalStatus" AS ENUM (
    'OPEN',
    'SELF_ASSESSMENT',
    'MANAGER_REVIEW',
    'HR_REVIEW',
    'PUBLISHED'
);


ALTER TYPE public."AppraisalStatus" OWNER TO "user";

--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalStatus" OWNER TO "user";

--
-- Name: AssessmentType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AssessmentType" AS ENUM (
    'TECHNICAL',
    'BEHAVIORAL',
    'CODING'
);


ALTER TYPE public."AssessmentType" OWNER TO "user";

--
-- Name: AssetCategory; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AssetCategory" AS ENUM (
    'LAPTOP',
    'DESKTOP',
    'SERVER',
    'WIRED_KEYBOARD',
    'WIRED_MOUSE',
    'WIRELESS_KEYBOARD',
    'WIRELESS_MOUSE',
    'WEBCAM',
    'DOCKING_STATION',
    'MONITOR',
    'NETWORK_SWITCH',
    'FIREWALL',
    'ROUTER',
    'OTHER'
);


ALTER TYPE public."AssetCategory" OWNER TO "user";

--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'IN_STOCK',
    'POPS',
    'ASSIGNED',
    'RETIRED'
);


ALTER TYPE public."AssetStatus" OWNER TO "user";

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'LATE'
);


ALTER TYPE public."AttendanceStatus" OWNER TO "user";

--
-- Name: AttendanceType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."AttendanceType" AS ENUM (
    'OFFICE',
    'WFH',
    'ONSITE'
);


ALTER TYPE public."AttendanceType" OWNER TO "user";

--
-- Name: CMDBEnvironment; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CMDBEnvironment" AS ENUM (
    'PROD',
    'UAT',
    'DEV',
    'DR',
    'STAGING'
);


ALTER TYPE public."CMDBEnvironment" OWNER TO "user";

--
-- Name: CMDBItemStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CMDBItemStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'RETIRED'
);


ALTER TYPE public."CMDBItemStatus" OWNER TO "user";

--
-- Name: CMDBItemType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CMDBItemType" AS ENUM (
    'SERVER',
    'VM',
    'DATABASE',
    'APPLICATION',
    'NETWORK',
    'ENDPOINT',
    'SERVICE',
    'STORAGE',
    'OTHER'
);


ALTER TYPE public."CMDBItemType" OWNER TO "user";

--
-- Name: CMDBRelationshipType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."CMDBRelationshipType" AS ENUM (
    'DEPENDS_ON',
    'HOSTS',
    'RUNS_ON',
    'CONNECTS_TO',
    'BACKED_UP_BY',
    'PART_OF'
);


ALTER TYPE public."CMDBRelationshipType" OWNER TO "user";

--
-- Name: ChangeImpact; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChangeImpact" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."ChangeImpact" OWNER TO "user";

--
-- Name: ChangeRisk; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChangeRisk" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."ChangeRisk" OWNER TO "user";

--
-- Name: ChangeStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChangeStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'IMPLEMENTING',
    'IMPLEMENTED',
    'PIR_PENDING',
    'CLOSED'
);


ALTER TYPE public."ChangeStatus" OWNER TO "user";

--
-- Name: ChangeType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChangeType" AS ENUM (
    'STANDARD',
    'NORMAL',
    'EMERGENCY'
);


ALTER TYPE public."ChangeType" OWNER TO "user";

--
-- Name: ChangeUrgency; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ChangeUrgency" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."ChangeUrgency" OWNER TO "user";

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ConversationType" AS ENUM (
    'DIRECT',
    'GROUP'
);


ALTER TYPE public."ConversationType" OWNER TO "user";

--
-- Name: DocType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DocType" AS ENUM (
    'ONBOARDING',
    'RESIGNATION',
    'DP',
    'OTHER'
);


ALTER TYPE public."DocType" OWNER TO "user";

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."DocumentType" AS ENUM (
    'ONBOARDING',
    'RESIGNATION',
    'PROFILE_PIC',
    'OTHER',
    'EXPERIENCE_LETTER',
    'SALARY_SLIP',
    'RELIEVING_LETTER'
);


ALTER TYPE public."DocumentType" OWNER TO "user";

--
-- Name: GoalStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."GoalStatus" AS ENUM (
    'PENDING',
    'ACHIEVED',
    'PARTIAL',
    'MISSED'
);


ALTER TYPE public."GoalStatus" OWNER TO "user";

--
-- Name: HolidayType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."HolidayType" AS ENUM (
    'PUBLIC',
    'OPTIONAL'
);


ALTER TYPE public."HolidayType" OWNER TO "user";

--
-- Name: InterviewStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."InterviewStatus" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."InterviewStatus" OWNER TO "user";

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."JobStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'DRAFT',
    'HOLD'
);


ALTER TYPE public."JobStatus" OWNER TO "user";

--
-- Name: LeaveStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."LeaveStatus" OWNER TO "user";

--
-- Name: LeaveType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."LeaveType" AS ENUM (
    'CASUAL',
    'SICK',
    'EARNED'
);


ALTER TYPE public."LeaveType" OWNER TO "user";

--
-- Name: LegacyRole; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."LegacyRole" AS ENUM (
    'EMPLOYEE',
    'MANAGER',
    'HR',
    'ADMIN'
);


ALTER TYPE public."LegacyRole" OWNER TO "user";

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'APPROVAL_REQUEST'
);


ALTER TYPE public."MessageType" OWNER TO "user";

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'GENERATED',
    'SENT',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE public."OfferStatus" OWNER TO "user";

--
-- Name: ProblemStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ProblemStatus" AS ENUM (
    'OPEN',
    'UNDER_INVESTIGATION',
    'ROOT_CAUSE_IDENTIFIED',
    'KNOWN_ERROR',
    'CLOSED'
);


ALTER TYPE public."ProblemStatus" OWNER TO "user";

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."RequestStatus" OWNER TO "user";

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'SELF_DONE',
    'MANAGER_DONE',
    'HR_APPROVED',
    'PUBLISHED'
);


ALTER TYPE public."ReviewStatus" OWNER TO "user";

--
-- Name: RoleType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RoleType" AS ENUM (
    'INDIVIDUAL_CONTRIBUTOR',
    'LEADERSHIP',
    'EXECUTIVE',
    'ADMINISTRATOR'
);


ALTER TYPE public."RoleType" OWNER TO "user";

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."TicketPriority" OWNER TO "user";

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'ON_HOLD',
    'WAITING_FOR_USER',
    'PENDING_VENDOR',
    'PENDING_OTHER',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO "user";

--
-- Name: TicketType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."TicketType" AS ENUM (
    'INCIDENT',
    'SERVICE_REQUEST'
);


ALTER TYPE public."TicketType" OWNER TO "user";

--
-- Name: WorkLocation; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."WorkLocation" AS ENUM (
    'REMOTE',
    'OFFICE',
    'CLIENT'
);


ALTER TYPE public."WorkLocation" OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Application" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "candidateId" text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    "aiScore" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Application" OWNER TO "user";

--
-- Name: AppraisalCycle; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."AppraisalCycle" (
    id text NOT NULL,
    quarter integer NOT NULL,
    year integer NOT NULL,
    status public."AppraisalStatus" DEFAULT 'OPEN'::public."AppraisalStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    phase text DEFAULT 'GOAL_SETTING'::text NOT NULL
);


ALTER TABLE public."AppraisalCycle" OWNER TO "user";

--
-- Name: AppraisalGoal; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."AppraisalGoal" (
    id text NOT NULL,
    "cycleId" text NOT NULL,
    "userId" text NOT NULL,
    "setById" text NOT NULL,
    title text NOT NULL,
    description text,
    weight double precision DEFAULT 100 NOT NULL,
    status public."GoalStatus" DEFAULT 'PENDING'::public."GoalStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "kraCategory" text,
    "hrApproved" boolean DEFAULT false NOT NULL,
    "selfRating" double precision,
    "selfComment" text,
    "selfAttachmentUrl" text,
    "selfSubmittedAt" timestamp(3) without time zone,
    "managerRating" double precision,
    "managerComment" text,
    "managerReviewedAt" timestamp(3) without time zone,
    "acceptedByEmployee" boolean DEFAULT false NOT NULL,
    "employeeConcern" text,
    "acceptedAt" timestamp(3) without time zone
);


ALTER TABLE public."AppraisalGoal" OWNER TO "user";

--
-- Name: AppraisalReview; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."AppraisalReview" (
    id text NOT NULL,
    "cycleId" text NOT NULL,
    "userId" text NOT NULL,
    "managerId" text,
    "selfRating" double precision,
    "selfComment" text,
    "selfSubmittedAt" timestamp(3) without time zone,
    "managerRating" double precision,
    "managerComment" text,
    "managerApproved" boolean DEFAULT false NOT NULL,
    "managerReviewedAt" timestamp(3) without time zone,
    "finalRating" double precision,
    "salaryHike" double precision,
    "hikeAmount" double precision,
    "hrApproved" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    status public."ReviewStatus" DEFAULT 'PENDING'::public."ReviewStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "newCTC" double precision,
    "pdfUrl" text,
    "annualSelfRating" double precision,
    "managerFinalRating" double precision,
    "finalApprovedBy" text,
    "finalApprovedAt" timestamp(3) without time zone,
    "letterSentAt" timestamp(3) without time zone
);


ALTER TABLE public."AppraisalReview" OWNER TO "user";

--
-- Name: Assessment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Assessment" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    type public."AssessmentType" NOT NULL,
    questions jsonb,
    responses jsonb,
    score integer,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "analysisReport" text
);


ALTER TABLE public."Assessment" OWNER TO "user";

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "serialNumber" text NOT NULL,
    name text NOT NULL,
    category public."AssetCategory" DEFAULT 'OTHER'::public."AssetCategory" NOT NULL,
    status public."AssetStatus" DEFAULT 'IN_STOCK'::public."AssetStatus" NOT NULL,
    configuration jsonb,
    "warrantyExpiry" timestamp(3) without time zone,
    "assetId" text,
    "organizationId" text NOT NULL,
    "officeId" text,
    "assignedToId" text,
    "qrCodeUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO "user";

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "clockIn" timestamp(3) without time zone NOT NULL,
    "clockOut" timestamp(3) without time zone,
    status public."AttendanceStatus" NOT NULL,
    type public."AttendanceType" DEFAULT 'OFFICE'::public."AttendanceType" NOT NULL,
    latitude double precision,
    longitude double precision,
    address text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "officeId" text
);


ALTER TABLE public."Attendance" OWNER TO "user";

--
-- Name: Band; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Band" (
    id text NOT NULL,
    name text NOT NULL,
    level integer NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Band" OWNER TO "user";

--
-- Name: CMDBItem; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."CMDBItem" (
    id text NOT NULL,
    "ciNumber" text NOT NULL,
    name text NOT NULL,
    type public."CMDBItemType" DEFAULT 'SERVER'::public."CMDBItemType" NOT NULL,
    status public."CMDBItemStatus" DEFAULT 'ACTIVE'::public."CMDBItemStatus" NOT NULL,
    environment public."CMDBEnvironment" DEFAULT 'PROD'::public."CMDBEnvironment" NOT NULL,
    "ownerId" text,
    "managedById" text,
    "ipAddress" text,
    "hostName" text,
    location text,
    description text,
    attributes jsonb,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CMDBItem" OWNER TO "user";

--
-- Name: CMDBRelationship; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."CMDBRelationship" (
    id text NOT NULL,
    "sourceId" text NOT NULL,
    "targetId" text NOT NULL,
    "relationshipType" public."CMDBRelationshipType" DEFAULT 'DEPENDS_ON'::public."CMDBRelationshipType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CMDBRelationship" OWNER TO "user";

--
-- Name: Candidate; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Candidate" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    "resumeUrl" text,
    skills text[],
    "experienceYears" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Candidate" OWNER TO "user";

--
-- Name: Certification; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Certification" (
    id text NOT NULL,
    name text NOT NULL,
    "issuingOrg" text NOT NULL,
    "credentialUrl" text,
    "issueDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "imageUrl" text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Certification" OWNER TO "user";

--
-- Name: ChangeActivity; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChangeActivity" (
    id text NOT NULL,
    "changeRequestId" text NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChangeActivity" OWNER TO "user";

--
-- Name: ChangeApproval; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChangeApproval" (
    id text NOT NULL,
    "changeRequestId" text NOT NULL,
    "approverId" text NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChangeApproval" OWNER TO "user";

--
-- Name: ChangeComment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChangeComment" (
    id text NOT NULL,
    "changeRequestId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChangeComment" OWNER TO "user";

--
-- Name: ChangeRequest; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChangeRequest" (
    id text NOT NULL,
    "changeNumber" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    risk public."ChangeRisk" DEFAULT 'LOW'::public."ChangeRisk" NOT NULL,
    status public."ChangeStatus" DEFAULT 'DRAFT'::public."ChangeStatus" NOT NULL,
    "requesterId" text NOT NULL,
    "approvedById" text,
    "cabMeetingDate" timestamp(3) without time zone,
    "plannedStart" timestamp(3) without time zone,
    "plannedEnd" timestamp(3) without time zone,
    "actualStart" timestamp(3) without time zone,
    "actualEnd" timestamp(3) without time zone,
    "rollbackPlan" text,
    "pirNotes" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    impact public."ChangeImpact" DEFAULT 'LOW'::public."ChangeImpact" NOT NULL,
    "implementationPlan" text,
    justification text,
    "testPlan" text,
    type public."ChangeType" DEFAULT 'NORMAL'::public."ChangeType" NOT NULL,
    urgency public."ChangeUrgency" DEFAULT 'LOW'::public."ChangeUrgency" NOT NULL,
    "assignmentGroupId" text,
    "attachmentUrls" text[] DEFAULT ARRAY[]::text[],
    "implementerId" text
);


ALTER TABLE public."ChangeRequest" OWNER TO "user";

--
-- Name: ChangeRequestCI; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChangeRequestCI" (
    id text NOT NULL,
    "changeRequestId" text NOT NULL,
    "ciId" text NOT NULL
);


ALTER TABLE public."ChangeRequestCI" OWNER TO "user";

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    name text,
    type public."ConversationType" DEFAULT 'DIRECT'::public."ConversationType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO "user";

--
-- Name: ConversationParticipant; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ConversationParticipant" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConversationParticipant" OWNER TO "user";

--
-- Name: Department; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "organizationId" text NOT NULL
);


ALTER TABLE public."Department" OWNER TO "user";

--
-- Name: Document; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    type public."DocumentType" NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "workExperienceId" text
);


ALTER TABLE public."Document" OWNER TO "user";

--
-- Name: HikeAllocation; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."HikeAllocation" (
    id text NOT NULL,
    "cycleId" text NOT NULL,
    "userId" text NOT NULL,
    "managerId" text NOT NULL,
    "hikePercent" double precision NOT NULL,
    "hikeAmount" double precision NOT NULL,
    "newCTC" double precision NOT NULL,
    "effectiveDate" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "pdfUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HikeAllocation" OWNER TO "user";

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    name text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    type public."HolidayType" DEFAULT 'PUBLIC'::public."HolidayType" NOT NULL,
    "organizationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO "user";

--
-- Name: Interview; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Interview" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "interviewerId" text NOT NULL,
    round text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    feedback text,
    rating double precision,
    status public."InterviewStatus" DEFAULT 'SCHEDULED'::public."InterviewStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Interview" OWNER TO "user";

--
-- Name: JobPosting; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."JobPosting" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    requirements text,
    "departmentId" text,
    location text,
    type text,
    "salaryRange" text,
    status public."JobStatus" DEFAULT 'OPEN'::public."JobStatus" NOT NULL,
    "postedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JobPosting" OWNER TO "user";

--
-- Name: KEDBEntry; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."KEDBEntry" (
    id text NOT NULL,
    title text NOT NULL,
    symptoms text NOT NULL,
    "rootCause" text NOT NULL,
    workaround text NOT NULL,
    resolution text,
    "articleUrl" text,
    "problemId" text,
    "createdById" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."KEDBEntry" OWNER TO "user";

--
-- Name: Leave; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Leave" (
    id text NOT NULL,
    type public."LeaveType" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    status public."LeaveStatus" DEFAULT 'PENDING'::public."LeaveStatus" NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approverId" text
);


ALTER TABLE public."Leave" OWNER TO "user";

--
-- Name: LeaveBalance; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LeaveBalance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "casualLeaves" double precision DEFAULT 24 NOT NULL,
    "earnedLeaves" double precision DEFAULT 20 NOT NULL,
    "sickLeaves" double precision DEFAULT 10 NOT NULL,
    year integer DEFAULT 2025 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeaveBalance" OWNER TO "user";

--
-- Name: LeavePolicy; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LeavePolicy" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "casualLeaves" integer DEFAULT 24 NOT NULL,
    "earnedLeaves" integer DEFAULT 20 NOT NULL,
    encashable boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeavePolicy" OWNER TO "user";

--
-- Name: Message; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    content text,
    type public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    "fileUrl" text,
    "approvalStatus" public."ApprovalStatus",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "referenceId" text
);


ALTER TABLE public."Message" OWNER TO "user";

--
-- Name: MessageReadStatus; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."MessageReadStatus" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReadStatus" OWNER TO "user";

--
-- Name: OffboardingRequest; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."OffboardingRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "lastDay" timestamp(3) without time zone NOT NULL,
    reason text,
    "initiatedBy" text DEFAULT 'SELF'::text NOT NULL,
    "managerApprovedAt" timestamp(3) without time zone,
    "itClearedAt" timestamp(3) without time zone,
    "hrApprovedAt" timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OffboardingRequest" OWNER TO "user";

--
-- Name: Offer; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Offer" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "basicSalary" double precision NOT NULL,
    allowances double precision NOT NULL,
    "joiningDate" timestamp(3) without time zone NOT NULL,
    status public."OfferStatus" DEFAULT 'GENERATED'::public."OfferStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Offer" OWNER TO "user";

--
-- Name: Office; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Office" (
    id text NOT NULL,
    address text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    radius double precision DEFAULT 200 NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Office" OWNER TO "user";

--
-- Name: OfficeVisitRequest; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."OfficeVisitRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "targetOfficeId" text NOT NULL,
    date date NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "managerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OfficeVisitRequest" OWNER TO "user";

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    website text,
    latitude double precision,
    longitude double precision,
    "ownerId" text,
    "logoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "configDirectorAccess" boolean DEFAULT false NOT NULL,
    "configHrAccess" boolean DEFAULT false NOT NULL,
    "primaryColor" text DEFAULT '#a855f7'::text,
    "accentColor" text DEFAULT '#ec4899'::text,
    "themeMode" text DEFAULT 'dark'::text,
    "loginBgUrl" text,
    "loginBgType" text DEFAULT 'gradient'::text,
    "contactEmail" text,
    "gstNumber" text
);


ALTER TABLE public."Organization" OWNER TO "user";

--
-- Name: Payroll; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Payroll" (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "basicSalary" double precision NOT NULL,
    allowances double precision NOT NULL,
    deductions double precision NOT NULL,
    "netPay" double precision NOT NULL,
    status text DEFAULT 'PROCESSED'::text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payroll" OWNER TO "user";

--
-- Name: PayrollRecord; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."PayrollRecord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "totalDays" integer NOT NULL,
    "workingDays" integer NOT NULL,
    "presentDays" double precision NOT NULL,
    "paidLeaves" double precision NOT NULL,
    "lopDays" double precision NOT NULL,
    "grossEarnings" double precision NOT NULL,
    "totalDeductions" double precision NOT NULL,
    "netPay" double precision NOT NULL,
    basic double precision NOT NULL,
    hra double precision NOT NULL,
    da double precision NOT NULL,
    allowances double precision NOT NULL,
    "pfEmployee" double precision NOT NULL,
    "pfEmployer" double precision NOT NULL,
    "professionalTax" double precision NOT NULL,
    tds double precision NOT NULL,
    "otherDeductions" double precision NOT NULL,
    "isLopWaived" boolean DEFAULT false NOT NULL,
    "waiverReason" text,
    "waivedBy" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PayrollRecord" OWNER TO "user";

--
-- Name: Performance; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Performance" (
    id text NOT NULL,
    period text NOT NULL,
    rating double precision NOT NULL,
    feedback text NOT NULL,
    goals jsonb,
    "reviewerId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Performance" OWNER TO "user";

--
-- Name: Problem; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Problem" (
    id text NOT NULL,
    "problemNumber" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."ProblemStatus" DEFAULT 'OPEN'::public."ProblemStatus" NOT NULL,
    "assigneeId" text,
    "rootCause" text,
    workaround text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignmentGroupId" text,
    "attachmentUrls" text[] DEFAULT ARRAY[]::text[],
    "categoryId" text,
    impact public."TicketPriority" DEFAULT 'LOW'::public."TicketPriority" NOT NULL,
    priority public."TicketPriority" DEFAULT 'LOW'::public."TicketPriority" NOT NULL,
    urgency public."TicketPriority" DEFAULT 'LOW'::public."TicketPriority" NOT NULL
);


ALTER TABLE public."Problem" OWNER TO "user";

--
-- Name: ProblemActivity; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ProblemActivity" (
    id text NOT NULL,
    "problemId" text NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProblemActivity" OWNER TO "user";

--
-- Name: Role; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    type public."RoleType" DEFAULT 'INDIVIDUAL_CONTRIBUTOR'::public."RoleType" NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO "user";

--
-- Name: Roster; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Roster" (
    id text NOT NULL,
    "userId" text NOT NULL,
    date date NOT NULL,
    "shiftId" text NOT NULL,
    "assignedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Roster" OWNER TO "user";

--
-- Name: SLAPolicy; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."SLAPolicy" (
    id text NOT NULL,
    name text NOT NULL,
    priority public."TicketPriority" NOT NULL,
    "ticketType" public."TicketType" NOT NULL,
    "responseTimeMinutes" integer NOT NULL,
    "resolutionTimeMinutes" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SLAPolicy" OWNER TO "user";

--
-- Name: SalaryStructure; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."SalaryStructure" (
    id text NOT NULL,
    "userId" text NOT NULL,
    basic double precision DEFAULT 0 NOT NULL,
    hra double precision DEFAULT 0 NOT NULL,
    da double precision DEFAULT 0 NOT NULL,
    "travelAllowance" double precision DEFAULT 0 NOT NULL,
    "medicalAllowance" double precision DEFAULT 0 NOT NULL,
    "specialAllowance" double precision DEFAULT 0 NOT NULL,
    bonus double precision DEFAULT 0 NOT NULL,
    "pfConfig" text DEFAULT 'STANDARD_12'::text NOT NULL,
    "pfFixedAmount" double precision DEFAULT 0 NOT NULL,
    "ptConfig" text DEFAULT 'STANDARD_STATE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ctcAnnual" double precision
);


ALTER TABLE public."SalaryStructure" OWNER TO "user";

--
-- Name: ServiceDeskCounter; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ServiceDeskCounter" (
    id text NOT NULL,
    prefix text NOT NULL,
    current integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ServiceDeskCounter" OWNER TO "user";

--
-- Name: ServiceDeskMember; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ServiceDeskMember" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "userId" text NOT NULL,
    "isLead" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ServiceDeskMember" OWNER TO "user";

--
-- Name: ServiceDeskTeam; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ServiceDeskTeam" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ServiceDeskTeam" OWNER TO "user";

--
-- Name: Shift; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Shift" (
    id text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Shift" OWNER TO "user";

--
-- Name: Skill; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Skill" (
    id text NOT NULL,
    name text NOT NULL,
    "experienceYears" double precision,
    rating double precision,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Skill" OWNER TO "user";

--
-- Name: TeamBudget; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."TeamBudget" (
    id text NOT NULL,
    "cycleId" text NOT NULL,
    "managerId" text NOT NULL,
    "departmentId" text,
    "totalBudget" double precision NOT NULL,
    "usedBudget" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TeamBudget" OWNER TO "user";

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."TicketType" DEFAULT 'INCIDENT'::public."TicketType" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    "requesterId" text NOT NULL,
    "assigneeId" text,
    "teamId" text,
    "categoryId" text,
    "slaId" text,
    "slaResponseDue" timestamp(3) without time zone,
    "slaResolutionDue" timestamp(3) without time zone,
    "slaBreached" boolean DEFAULT false NOT NULL,
    "ciId" text,
    "problemId" text,
    "changeRequestId" text,
    "resolvedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    resolution text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attachmentUrls" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public."Ticket" OWNER TO "user";

--
-- Name: TicketActivity; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."TicketActivity" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketActivity" OWNER TO "user";

--
-- Name: TicketCategoryModel; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."TicketCategoryModel" (
    id text NOT NULL,
    name text NOT NULL,
    "ticketType" public."TicketType" DEFAULT 'INCIDENT'::public."TicketType" NOT NULL,
    "teamId" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketCategoryModel" OWNER TO "user";

--
-- Name: TicketComment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."TicketComment" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketComment" OWNER TO "user";

--
-- Name: User; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    "organizationId" text,
    "roleId" text,
    "bandId" text,
    "LegacyRole" public."LegacyRole" DEFAULT 'EMPLOYEE'::public."LegacyRole" NOT NULL,
    designation text,
    "profilePictureUrl" text,
    "bloodGroup" text,
    address text,
    "departmentId" text,
    "managerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text,
    skills text[],
    dob timestamp(3) without time zone,
    latitude double precision,
    longitude double precision,
    "permanentAddress" text,
    "personalEmail" text,
    "presentAddress" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "exitDate" timestamp(3) without time zone,
    "exitReason" text,
    "exitNotes" text,
    "assignedOfficeId" text,
    "panNumber" text,
    ufn text,
    "bankName" text,
    "bankAccountNumber" text,
    "ifscCode" text,
    "taxRegime" text DEFAULT 'NEW'::text,
    "mustChangePassword" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."User" OWNER TO "user";

--
-- Name: WFHLocation; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."WFHLocation" (
    id text NOT NULL,
    address text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    status public."LeaveStatus" DEFAULT 'PENDING'::public."LeaveStatus" NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WFHLocation" OWNER TO "user";

--
-- Name: WorkExperience; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."WorkExperience" (
    id text NOT NULL,
    "companyName" text NOT NULL,
    designation text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    description text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkExperience" OWNER TO "user";

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO "user";

--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Application" (id, "jobId", "candidateId", status, "aiScore", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AppraisalCycle; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."AppraisalCycle" (id, quarter, year, status, "createdAt", "updatedAt", phase) FROM stdin;
c73c480d-84e3-401e-ae10-b47e218fc34f	1	2026	OPEN	2026-02-26 12:44:52.409	2026-02-26 12:44:52.409	KRA_DRAFT
\.


--
-- Data for Name: AppraisalGoal; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."AppraisalGoal" (id, "cycleId", "userId", "setById", title, description, weight, status, "createdAt", "updatedAt", "kraCategory", "hrApproved", "selfRating", "selfComment", "selfAttachmentUrl", "selfSubmittedAt", "managerRating", "managerComment", "managerReviewedAt", "acceptedByEmployee", "employeeConcern", "acceptedAt") FROM stdin;
\.


--
-- Data for Name: AppraisalReview; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."AppraisalReview" (id, "cycleId", "userId", "managerId", "selfRating", "selfComment", "selfSubmittedAt", "managerRating", "managerComment", "managerApproved", "managerReviewedAt", "finalRating", "salaryHike", "hikeAmount", "hrApproved", "publishedAt", status, "createdAt", "updatedAt", "newCTC", "pdfUrl", "annualSelfRating", "managerFinalRating", "finalApprovedBy", "finalApprovedAt", "letterSentAt") FROM stdin;
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Assessment" (id, "applicationId", type, questions, responses, score, status, "createdAt", "updatedAt", "analysisReport") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Asset" (id, "serialNumber", name, category, status, configuration, "warrantyExpiry", "assetId", "organizationId", "officeId", "assignedToId", "qrCodeUrl", "createdAt", "updatedAt") FROM stdin;
64687607-2b08-45c3-ad11-803e299656d9	DHSJR24	Dell Pro 14	LAPTOP	ASSIGNED	{"memory": "16GB DDR5", "cpuCores": "core 5", "storageSize": "512GB SSD", "manufacturer": "Dell", "storageCount": "1", "networkAdapters": "1GBE, 1Wifi"}	2029-11-21 00:00:00	BSL-LPT-DHSJR24-24022026	06eb6b0c-b11a-442d-a525-7136f5f41eaf	ac5d5f8d-ee80-41b2-8e07-4caa6331630c	f02680be-4fe3-492a-b315-e0a07d1c7d25	\N	2026-02-24 07:26:58.813	2026-02-26 19:48:28.613
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Attendance" (id, date, "clockIn", "clockOut", status, type, latitude, longitude, address, "userId", "createdAt", "updatedAt", "officeId") FROM stdin;
98c7e31a-182d-41c1-b138-3ea3106d28ee	2026-02-23 00:00:00	2026-02-23 00:00:00	2026-02-23 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 08:07:58.371	2026-02-24 08:07:58.371	\N
f7704f48-8bad-45f9-841e-23200323307b	2026-02-23 00:00:00	2026-02-23 00:00:00	2026-02-23 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 08:07:58.437	2026-02-24 08:07:58.437	\N
2753e249-9776-4fff-a628-953e4dc1aca6	2026-02-24 00:00:00	2026-02-24 00:00:00	2026-02-24 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-25 02:52:29.516	2026-02-25 02:52:29.516	\N
630fd010-8de5-419a-a1dc-1183bf73e15b	2026-02-24 00:00:00	2026-02-24 00:00:00	2026-02-24 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-25 02:52:29.567	2026-02-25 02:52:29.567	\N
1b4b596d-8af8-4f00-8f05-ccd71ab47891	2026-02-25 05:59:11.291	2026-02-25 05:59:11.291	\N	PRESENT	WFH	18.5711979	73.9753707	Detected Location	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-25 05:59:11.293	2026-02-25 05:59:11.293	\N
1c570224-7545-48b5-89ec-a90168da3818	2026-02-25 00:00:00	2026-02-25 00:00:00	2026-02-25 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-26 03:38:42.79	2026-02-26 03:38:42.79	\N
cf7062b6-6a55-44e3-82a9-159ff8473234	2026-02-25 00:00:00	2026-02-25 00:00:00	2026-02-25 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-26 03:38:42.831	2026-02-26 03:38:42.831	\N
cd4cdbf7-5941-48fe-a958-c1fe10913d27	2026-02-26 12:44:44.643	2026-02-26 12:44:44.643	2026-02-26 18:19:48.78	PRESENT	WFH	18.5712178	73.975404	Detected Location	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-26 12:44:44.645	2026-02-26 18:19:48.782	\N
fce540b1-01f5-4b45-aa5f-6f66959488d5	2026-02-26 00:00:00	2026-02-26 00:00:00	2026-02-26 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-27 00:39:43.085	2026-02-27 00:39:43.085	\N
8c4c1f71-6f72-46f3-8716-71a17dead3a8	2026-02-26 00:00:00	2026-02-26 00:00:00	2026-02-26 18:00:00	PRESENT	OFFICE	12.9716	77.5946	Tech Park, Bangalore	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-27 00:39:43.099	2026-02-27 00:39:43.099	\N
\.


--
-- Data for Name: Band; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Band" (id, name, level, "organizationId", "createdAt", "updatedAt") FROM stdin;
84a0baff-f485-4de0-ae26-a08b2b4cbae4	BLI	1	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:42:40.136	2026-02-25 03:42:40.136
649698fa-c4c4-45fb-8d67-43297dcd0c65	BLI-II	2	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:42:52.485	2026-02-25 03:42:52.485
43ea3243-5051-49cd-a3cf-e5201f1825a8	SA-TL-I	3	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:43:04.829	2026-02-25 03:43:04.829
9296adb4-340c-42bd-b560-33d1ec39cc18	SA-TL-II	4	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:43:13.306	2026-02-25 03:43:13.306
f2e56d66-9f46-4e5c-9265-d1c507a44f2c	BMG-I	5	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:43:33.119	2026-02-25 03:43:33.119
1036b1f5-032c-4e0c-b901-0f1bda47273a	BMG-II	6	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:43:40.163	2026-02-25 03:43:40.163
8d7f163e-87b7-446a-8e34-be676651bf0e	BEXEC	7	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:43:47.966	2026-02-25 03:43:47.966
c4900daa-1e5c-44ee-b168-eeb01d12e248	BEXEC-II	8	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:44:05.523	2026-02-25 03:44:05.523
7d8db2db-c9d5-4fd4-8373-771f70b7fadd	BDR	9	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-25 03:44:13.488	2026-02-25 03:44:13.488
\.


--
-- Data for Name: CMDBItem; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."CMDBItem" (id, "ciNumber", name, type, status, environment, "ownerId", "managedById", "ipAddress", "hostName", location, description, attributes, "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CMDBRelationship; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."CMDBRelationship" (id, "sourceId", "targetId", "relationshipType", "createdAt") FROM stdin;
\.


--
-- Data for Name: Candidate; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Candidate" (id, "firstName", "lastName", email, phone, "resumeUrl", skills, "experienceYears", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Certification; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Certification" (id, name, "issuingOrg", "credentialUrl", "issueDate", "expiryDate", "imageUrl", "userId", "createdAt", "updatedAt") FROM stdin;
431d6db5-35e0-43cc-9812-8622724e8325	AWS SOLUTION ARCHITECT ASSOCIATE	Amazon web services	https://www.credly.com/badges/6b92cae7-6477-47ad-a4a7-4a0cc3be8f93/public_url	\N	\N	/uploads/certs/certBadges-1771918804173-831635216.png	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.666	2026-02-24 07:40:04.666
d5d0ce11-b686-4dc3-8dbc-5181333a202b	Azure Fundamentals	Microsoft	https://www.credly.com/badges/49fa734a-50e0-4aab-ac30-397080fd0806/public_url	\N	\N	/uploads/certs/certBadges-1771918804174-830734397.png	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.671	2026-02-24 07:40:04.671
5185715c-4742-4d83-9bb7-1775f6af70ae	Google Certified Professional - Associate Engineer	Google	https://www.credly.com/badges/159ddb98-cb60-4406-9072-dc135cf9909f/public_url	\N	\N	/uploads/certs/certBadges-1771918804174-234845547.png	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.674	2026-02-24 07:40:04.674
a58d1977-8657-41a2-b5a0-b76cda8f2e5c	Azure Certified Administrator	Microsoft		\N	\N	/uploads/certs/certBadges-1771999710954-34128519.png	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-25 06:08:31.174	2026-02-25 06:08:31.174
\.


--
-- Data for Name: ChangeActivity; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChangeActivity" (id, "changeRequestId", "actorId", action, "oldValue", "newValue", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChangeApproval; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChangeApproval" (id, "changeRequestId", "approverId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChangeComment; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChangeComment" (id, "changeRequestId", "authorId", body, "createdAt") FROM stdin;
3b5410a9-7a13-41e2-938f-f92b567bc71d	52021cfb-09e6-48d6-bfa8-54d8325e2ddd	6ec48729-b324-4e3c-b114-58cd03058faf	Approved	2026-02-27 06:58:30.99
\.


--
-- Data for Name: ChangeRequest; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChangeRequest" (id, "changeNumber", title, description, risk, status, "requesterId", "approvedById", "cabMeetingDate", "plannedStart", "plannedEnd", "actualStart", "actualEnd", "rollbackPlan", "pirNotes", "organizationId", "createdAt", "updatedAt", impact, "implementationPlan", justification, "testPlan", type, urgency, "assignmentGroupId", "attachmentUrls", "implementerId") FROM stdin;
52021cfb-09e6-48d6-bfa8-54d8325e2ddd	C-0005	Windows Server Patching	Windows Server Patching	LOW	CLOSED	6ec48729-b324-4e3c-b114-58cd03058faf	\N	2026-03-02 16:27:00	2026-03-04 12:26:00	2026-03-06 16:27:00	\N	\N	Snapshot will be restored	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-27 06:57:28.54	2026-02-27 06:59:13.089	LOW	Windows Server Patching	Windows Server Patching	Windows Server Patching	NORMAL	LOW	\N	{}	\N
\.


--
-- Data for Name: ChangeRequestCI; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChangeRequestCI" (id, "changeRequestId", "ciId") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Conversation" (id, name, type, "createdAt", "updatedAt") FROM stdin;
00de4724-f7bb-4cbb-812b-36282eb5ed8c	\N	DIRECT	2026-02-24 08:11:17.474	2026-02-24 08:11:17.474
5b58180b-564c-4e4b-ac94-ac9c5dec0e1d	Ticket: INC-0003	GROUP	2026-02-27 06:15:42.486	2026-02-27 06:15:42.486
\.


--
-- Data for Name: ConversationParticipant; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ConversationParticipant" (id, "conversationId", "userId", "joinedAt") FROM stdin;
605a6940-2a6a-4a82-ba57-9aaf68abfb92	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 08:11:17.474
7af5b095-259f-4ef7-bac7-65e50ea44626	00de4724-f7bb-4cbb-812b-36282eb5ed8c	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 08:11:17.474
07e1b23b-6a7b-465d-807a-e3231ace5b37	5b58180b-564c-4e4b-ac94-ac9c5dec0e1d	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-27 06:15:42.486
3f6eca83-bb74-4416-9a84-4498a66783d5	5b58180b-564c-4e4b-ac94-ac9c5dec0e1d	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-27 06:16:03.681
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Department" (id, name, "createdAt", "updatedAt", description, "organizationId") FROM stdin;
0ce780d1-05ba-46a2-b4e0-6c9a691b5344	Platform Operations	2026-02-24 07:40:37.67	2026-02-24 07:40:37.67	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
65b0719f-f57f-4415-9eb9-9521c9d554cd	Engineering-FR	2026-02-25 03:44:59.806	2026-02-25 03:44:59.806	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
64dec580-e75d-4cde-908c-899613bacad5	Engineering-VF	2026-02-25 03:45:10.867	2026-02-25 03:45:10.867	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
59f67495-b18d-43dc-be24-e28b57623bcf	Engineering-GSP	2026-02-25 03:45:19.522	2026-02-25 03:45:19.522	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
9967d369-4d90-4107-99e5-1d372eef6278	Admin	2026-02-25 03:45:25.013	2026-02-25 03:45:25.013	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
5e389bfe-ab34-44ca-922b-4a2358aa6e5c	HR- TAT	2026-02-25 03:45:47.09	2026-02-25 03:45:47.09	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
03e12a7e-7a09-45e6-b25f-2dde8418d188	HR-People Operations	2026-02-25 03:46:03.428	2026-02-25 03:46:03.428	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
97bd37f8-0e2d-4568-a131-03dda433b74f	Complaince-Audit	2026-02-25 03:46:40.846	2026-02-25 03:46:40.846	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
ec700c70-de22-45da-97fa-d29dfc27ac97	Engineering	2026-02-24 05:08:43.324	2026-02-24 05:08:43.324	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
9c4a7310-3459-443a-abaf-feeb6cae8412	Human Resources	2026-02-24 05:08:43.331	2026-02-24 05:08:43.331	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
653cb007-a789-4cfd-b6e9-2f7cc3dc33d7	Finance	2026-02-24 05:08:43.336	2026-02-24 05:08:43.336	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
b16a0c4a-c0fc-43df-84d4-0b3a51e81077	Marketing	2026-02-24 05:08:43.342	2026-02-24 05:08:43.342	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
ea8ee4e7-8b3a-4c44-a036-5febd880b9b3	Operations	2026-02-24 05:08:43.348	2026-02-24 05:08:43.348	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
248cb386-34ef-4949-8e97-c980a74d7cab	Sales	2026-02-24 05:08:43.354	2026-02-24 05:08:43.354	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
005c6c19-981b-462d-bdaf-979e603184b1	Product Management	2026-02-24 05:08:43.359	2026-02-24 05:08:43.359	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
a12d950f-c7c7-4a15-bba6-51575e61e40a	Design	2026-02-24 05:08:43.363	2026-02-24 05:08:43.363	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Document" (id, name, url, type, "userId", "createdAt", "updatedAt", "workExperienceId") FROM stdin;
\.


--
-- Data for Name: HikeAllocation; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."HikeAllocation" (id, "cycleId", "userId", "managerId", "hikePercent", "hikeAmount", "newCTC", "effectiveDate", "approvedAt", "pdfUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Holiday" (id, name, date, type, "organizationId", "createdAt", "updatedAt") FROM stdin;
e4389110-baeb-469d-8339-2145f7a5ddd9	New Year's Day	2026-01-01 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.975	2026-02-26 19:45:51.975
f7541de3-2150-409f-b409-90fd5ae69560	Republic Day	2026-01-26 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.978	2026-02-26 19:45:51.978
176b0b16-379c-4988-895c-c274115bec84	Holi	2026-03-04 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.98	2026-02-26 19:45:51.98
f5e28b93-135f-4808-90c0-b8793a4699e0	Id-ul-Fitr	2026-03-21 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.982	2026-02-26 19:45:51.982
284923f6-4881-49c7-8895-62c922d06156	Ram Navami	2026-03-26 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.983	2026-02-26 19:45:51.983
2047e407-f1b4-4fd4-b70e-04014406bd5b	Good Friday	2026-04-03 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.985	2026-02-26 19:45:51.985
a8e04b37-06cb-4c90-9a83-7689647d1dc1	Dr. Ambedkar Jayanti	2026-04-14 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.986	2026-02-26 19:45:51.986
d9a4daf1-7507-410e-939c-1a22025cd3c0	Buddha Purnima / Labour Day	2026-05-01 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.988	2026-02-26 19:45:51.988
686ae7c4-de73-4443-9906-c146573a70ad	Independence Day	2026-08-15 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.989	2026-02-26 19:45:51.989
3ec829b7-23b4-4b2d-9899-c1fd42ff08bb	Id-e-Milad	2026-08-26 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.99	2026-02-26 19:45:51.99
0dccffd1-b204-4ac1-9fdb-f0aab0f7a088	Janmashtami	2026-09-04 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.991	2026-02-26 19:45:51.991
e956ca52-0096-4b4c-8a1a-f16212d8e03c	Gandhi Jayanti	2026-10-02 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.992	2026-02-26 19:45:51.992
7757a9f1-661c-432a-af86-7d3e49489f3e	Dussehra	2026-10-20 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.993	2026-02-26 19:45:51.993
51808a9a-4109-4635-99ef-d8382fd26f53	Diwali	2026-11-08 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.995	2026-02-26 19:45:51.995
a76f024a-7508-4d3e-9062-4aee5575ed1b	Guru Nanak's Birthday	2026-11-24 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.996	2026-02-26 19:45:51.996
a64fff4f-b363-4228-9fc1-e4765afed9d6	Christmas Day	2026-12-25 00:00:00	PUBLIC	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:45:51.998	2026-02-26 19:45:51.998
\.


--
-- Data for Name: Interview; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Interview" (id, "applicationId", "interviewerId", round, "scheduledAt", feedback, rating, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JobPosting; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."JobPosting" (id, title, description, requirements, "departmentId", location, type, "salaryRange", status, "postedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KEDBEntry; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."KEDBEntry" (id, title, symptoms, "rootCause", workaround, resolution, "articleUrl", "problemId", "createdById", "organizationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Leave; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Leave" (id, type, "startDate", "endDate", reason, status, "userId", "createdAt", "updatedAt", "approverId") FROM stdin;
\.


--
-- Data for Name: LeaveBalance; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LeaveBalance" (id, "userId", "casualLeaves", "earnedLeaves", "sickLeaves", year, "updatedAt") FROM stdin;
\.


--
-- Data for Name: LeavePolicy; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LeavePolicy" (id, "organizationId", "casualLeaves", "earnedLeaves", encashable, "createdAt", "updatedAt") FROM stdin;
fa56b745-1064-4ac6-9a41-d206c22fa15e	06eb6b0c-b11a-442d-a525-7136f5f41eaf	24	20	t	2026-02-24 05:08:43.572	2026-02-24 05:08:43.572
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Message" (id, "conversationId", "senderId", content, type, "fileUrl", "approvalStatus", "createdAt", "referenceId") FROM stdin;
ad6a77b3-b606-4788-ab88-fef0399b20c6	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	hi	TEXT	\N	\N	2026-02-25 03:27:33.556	\N
4e33fa7d-6ae8-4e2b-ad3e-a1b003787891	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	hi	TEXT	\N	\N	2026-02-25 03:29:49.668	\N
2a064c10-a3e4-4c42-ba4a-e281a2f0b757	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25		IMAGE	/uploads/file-1771990222334.png	\N	2026-02-25 03:30:22.339	\N
cdc301fd-e74c-4db8-9005-7f377c81f509	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	😀	TEXT	\N	\N	2026-02-25 03:30:33.437	\N
aa42fee1-c496-45db-8271-2c53396b3524	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	hi	TEXT	\N	\N	2026-02-25 04:51:36.042	\N
e50d7a33-dfea-4041-92e9-e1e953e6fb73	00de4724-f7bb-4cbb-812b-36282eb5ed8c	f02680be-4fe3-492a-b315-e0a07d1c7d25	approve	TEXT	\N	\N	2026-02-26 17:53:13.425	\N
e63a0237-0c93-4f7d-b477-b0d0b04accc7	00de4724-f7bb-4cbb-812b-36282eb5ed8c	d88632bd-6f40-48c1-92ea-3be4bea043be	Approved	TEXT	\N	\N	2026-02-26 19:44:40.173	\N
504ee81a-bf56-40df-bab2-528a6391e530	5b58180b-564c-4e4b-ac94-ac9c5dec0e1d	6ec48729-b324-4e3c-b114-58cd03058faf	hi	TEXT	\N	\N	2026-02-27 06:18:43.351	\N
\.


--
-- Data for Name: MessageReadStatus; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."MessageReadStatus" (id, "messageId", "userId", "readAt") FROM stdin;
\.


--
-- Data for Name: OffboardingRequest; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."OffboardingRequest" (id, "userId", "lastDay", reason, "initiatedBy", "managerApprovedAt", "itClearedAt", "hrApprovedAt", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Offer; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Offer" (id, "applicationId", "basicSalary", allowances, "joiningDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Office; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Office" (id, address, latitude, longitude, radius, "organizationId", "createdAt", "updatedAt") FROM stdin;
ac5d5f8d-ee80-41b2-8e07-4caa6331630c	3rd floor, Tower 11, Candor Techspace, Dundahera Village, Sector 21, Gurugram, Haryana 122016	28.51025358409593	77.07283528256005	200	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 07:18:33.865	2026-02-24 07:18:33.865
51bef6d4-0cdf-4f17-af60-166297f8983f	Plot Number 15, Electronic City, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015	28.4993403307173	77.06976868075765	200	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 07:21:30.462	2026-02-24 07:21:30.462
fe801e2a-a8ed-46dc-bcf4-a03b200f6d9d	7th floor, Knowledge Boulevard, Plot A/8A, A Block, Block A, Industrial Area, Sector 62, Noida, Uttar Pradesh 201309	28.63007630188514	77.3679262123497	200	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 07:23:39.562	2026-02-24 07:23:39.562
\.


--
-- Data for Name: OfficeVisitRequest; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."OfficeVisitRequest" (id, "userId", "targetOfficeId", date, status, "managerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Organization" (id, name, address, website, latitude, longitude, "ownerId", "logoUrl", "createdAt", "updatedAt", "configDirectorAccess", "configHrAccess", "primaryColor", "accentColor", "themeMode", "loginBgUrl", "loginBgType", "contactEmail", "gstNumber") FROM stdin;
06eb6b0c-b11a-442d-a525-7136f5f41eaf	Binary Semantics Limited	Plot # 38, Sector 18, Udyog Vihar, Gurugram, Haryana 122015	www.binarysemantics.com	\N	\N	037e176f-5e7c-4ad3-b388-537bec8a1888	/uploads/logos/bsl-logo.png	2026-02-24 05:08:43.263	2026-02-27 05:51:06.659	f	f	#a855f7	#ec4899	dark	/uploads/backgrounds/bg-1771919395312.png	image	\N	\N
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Payroll" (id, month, year, "basicSalary", allowances, deductions, "netPay", status, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollRecord; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."PayrollRecord" (id, "userId", month, year, "totalDays", "workingDays", "presentDays", "paidLeaves", "lopDays", "grossEarnings", "totalDeductions", "netPay", basic, hra, da, allowances, "pfEmployee", "pfEmployer", "professionalTax", tds, "otherDeductions", "isLopWaived", "waiverReason", "waivedBy", status, "generatedAt") FROM stdin;
\.


--
-- Data for Name: Performance; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Performance" (id, period, rating, feedback, goals, "reviewerId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Problem; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Problem" (id, "problemNumber", title, description, status, "assigneeId", "rootCause", workaround, "organizationId", "createdAt", "updatedAt", "assignmentGroupId", "attachmentUrls", "categoryId", impact, priority, urgency) FROM stdin;
\.


--
-- Data for Name: ProblemActivity; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ProblemActivity" (id, "problemId", "actorId", action, "oldValue", "newValue", "createdAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Role" (id, name, type, "organizationId", "createdAt", "updatedAt") FROM stdin;
c9178721-3e94-4ce3-803a-a0dccbf2fb04	Individual Contributor	INDIVIDUAL_CONTRIBUTOR	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.277	2026-02-24 05:08:43.277
52e45980-7ca6-47db-b080-44143743f496	Tech Lead	INDIVIDUAL_CONTRIBUTOR	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.286	2026-02-24 05:08:43.286
915faa8a-4bae-4276-b563-d5db154614dd	Manager	LEADERSHIP	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.293	2026-02-24 05:08:43.293
90a7f175-c58b-475c-bea5-32c5374360d8	Director	EXECUTIVE	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.299	2026-02-24 05:08:43.299
98bf5e26-175c-45af-8d0d-38f8ecf2452a	Admin	ADMINISTRATOR	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.305	2026-02-24 05:08:43.305
05f47d7c-f7af-47bb-b59a-dbcffb500dc0	HR	ADMINISTRATOR	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.312	2026-02-24 05:08:43.312
c7206753-3b95-427c-ad94-abbfc2e9de1a	AssetMgr	ADMINISTRATOR	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-24 05:08:43.317	2026-02-24 05:08:43.317
\.


--
-- Data for Name: Roster; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Roster" (id, "userId", date, "shiftId", "assignedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: SLAPolicy; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."SLAPolicy" (id, name, priority, "ticketType", "responseTimeMinutes", "resolutionTimeMinutes", "isActive", "organizationId", "createdAt", "updatedAt") FROM stdin;
fa97730f-b590-4219-a494-636ae75283d7	P0 - Critical	CRITICAL	INCIDENT	15	240	t	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:51:09.368	2026-02-26 19:51:09.368
83e49ed2-5262-45de-a7e7-621cee88a61d	P1 - HiGH	HIGH	INCIDENT	30	480	t	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:51:53.129	2026-02-26 19:51:53.129
5f4b71d0-31d3-4372-a64c-a976aca821ad	P2 - Medium	MEDIUM	INCIDENT	120	12	t	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:52:32.32	2026-02-26 19:52:32.32
3dd0ceeb-c3ca-4272-9c8a-88533b0e924d	P3	LOW	INCIDENT	240	2880	t	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:55:11.123	2026-02-26 19:55:11.123
\.


--
-- Data for Name: SalaryStructure; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."SalaryStructure" (id, "userId", basic, hra, da, "travelAllowance", "medicalAllowance", "specialAllowance", bonus, "pfConfig", "pfFixedAmount", "ptConfig", "createdAt", "updatedAt", "ctcAnnual") FROM stdin;
\.


--
-- Data for Name: ServiceDeskCounter; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ServiceDeskCounter" (id, prefix, current) FROM stdin;
0620b9ac-abde-45b3-a76f-a5feb06810bb	SR	0
7c72c17b-9bb9-423c-ba7b-3a2c2dd16d8c	P	0
42ab5258-db82-4a03-b357-0c2748cb48e0	CI	0
dbca169d-bef8-42ea-9bca-373577e03628	INC	3
d8341125-c52d-446e-9992-6c287ef1632b	C	5
\.


--
-- Data for Name: ServiceDeskMember; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ServiceDeskMember" (id, "teamId", "userId", "isLead") FROM stdin;
0cae1a3d-65a8-45bc-8b9e-edc40498139b	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	6ec48729-b324-4e3c-b114-58cd03058faf	f
dd9c2bdd-316d-4b63-8ba1-2947c7fd57c4	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	d88632bd-6f40-48c1-92ea-3be4bea043be	f
a3a75870-b191-4584-91ec-4677def73829	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	f02680be-4fe3-492a-b315-e0a07d1c7d25	f
\.


--
-- Data for Name: ServiceDeskTeam; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ServiceDeskTeam" (id, name, description, "organizationId", "createdAt", "updatedAt") FROM stdin;
9834e92f-1cfd-4d9e-9493-cbed0cfb3070	Platform Operations		06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:49:12.62	2026-02-26 19:49:12.62
\.


--
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Shift" (id, name, "startTime", "endTime", "createdAt", "updatedAt") FROM stdin;
4cd444f7-6cfc-4ab1-b9a9-0b5b1ad5b666	General	09:00	18:00	2026-02-24 05:08:43.875	2026-02-24 05:08:43.875
2d7ca491-571e-48d1-996e-5b0ebd47bf05	Morning	06:00	14:00	2026-02-24 05:08:43.881	2026-02-24 05:08:43.881
e3735267-d3b3-4610-a859-df2f03c80b25	Night	22:00	06:00	2026-02-24 05:08:43.885	2026-02-24 05:08:43.885
4309dfb0-697c-49db-83ae-6b2f12b190d9	WO	00:00	00:00	2026-02-24 05:08:43.89	2026-02-24 05:08:43.89
ef054fc3-a328-4e0c-b200-552be95f6b92	GH	00:00	00:00	2026-02-24 05:08:43.895	2026-02-24 05:08:43.895
b599b9a5-6096-486c-8a14-1b0f7c8fd532	SL	00:00	00:00	2026-02-24 05:08:43.9	2026-02-24 05:08:43.9
\.


--
-- Data for Name: Skill; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Skill" (id, name, "experienceYears", rating, "userId", "createdAt", "updatedAt") FROM stdin;
a8e49b7b-b343-45ef-b67b-ade396c83f51	Strategic Planning	24	24	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 07:29:54.945	2026-02-24 07:29:54.945
b49e7887-58e2-4658-aa80-5d99772c99fa	Budget Management	24	24	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 07:29:54.945	2026-02-24 07:29:54.945
a888d125-6e9f-4fc0-a5e0-b84156e6d79e	Organizational Development	24	24	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 07:29:54.945	2026-02-24 07:29:54.945
8fc760ef-5b9d-4e83-8dd0-d40efde930d4	Team Leadership	12	12	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.661	2026-02-24 07:40:04.661
21849145-4ae1-4aaa-902f-ba03d83dc684	Technical Strategy	12	12	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.661	2026-02-24 07:40:04.661
452fb5c6-bf49-4b3f-a11c-0308a63f6374	Mentoring	20	20	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.661	2026-02-24 07:40:04.661
4b9f2a3d-8756-4cd8-9b40-30c6717263f5	Recruitment	12	12	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-24 07:40:04.661	2026-02-24 07:40:04.661
273d9227-859d-42c2-b7fd-d7f21c6f0479	AWS	4	4	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-25 06:08:31.172	2026-02-25 06:08:31.172
5a397b62-86d4-4b81-b683-8c497d4c1b4b	Terraform	4	4	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-25 06:08:31.172	2026-02-25 06:08:31.172
48a1a81c-21f4-48e3-a154-8b129dd43744	Docker	4	4	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-25 06:08:31.172	2026-02-25 06:08:31.172
10de800d-f85c-4e06-866d-4669eefd6b08	Kubernetes	4	4	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-25 06:08:31.172	2026-02-25 06:08:31.172
\.


--
-- Data for Name: TeamBudget; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."TeamBudget" (id, "cycleId", "managerId", "departmentId", "totalBudget", "usedBudget", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Ticket" (id, "ticketNumber", title, description, type, status, priority, "requesterId", "assigneeId", "teamId", "categoryId", "slaId", "slaResponseDue", "slaResolutionDue", "slaBreached", "ciId", "problemId", "changeRequestId", "resolvedAt", "closedAt", resolution, "organizationId", "createdAt", "updatedAt", "attachmentUrls") FROM stdin;
0b288137-d104-435f-b98e-6aa5b404a1f2	INC-0001	Test Ticket	TEst Ticket to Test Servive desk basic Functionality	INCIDENT	RESOLVED	LOW	d88632bd-6f40-48c1-92ea-3be4bea043be	f02680be-4fe3-492a-b315-e0a07d1c7d25	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	c414f79b-0cd7-423d-9435-50b027f662bd	3dd0ceeb-c3ca-4272-9c8a-88533b0e924d	2026-02-26 23:56:35.945	2026-02-28 19:56:35.945	f	\N	\N	\N	2026-02-26 19:57:36.158	\N	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:56:35.947	2026-02-26 19:57:36.16	{}
c2bae5f2-240a-4abf-aee0-1bb12af11aee	INC-0002	test ticket	ticket	INCIDENT	IN_PROGRESS	LOW	d88632bd-6f40-48c1-92ea-3be4bea043be	6ec48729-b324-4e3c-b114-58cd03058faf	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	c414f79b-0cd7-423d-9435-50b027f662bd	3dd0ceeb-c3ca-4272-9c8a-88533b0e924d	2026-02-27 09:55:34.831	2026-03-01 05:55:34.831	f	\N	\N	\N	\N	\N	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-27 05:55:34.834	2026-02-27 05:58:49.072	{/uploads/attachments-1772171734786.png,/uploads/attachments-1772171734797.png}
e72e698a-c8b3-425b-a596-4f21749122c0	INC-0003	test incident - to test chat and attachments	test incident - to test chat and attachments	INCIDENT	RESOLVED	LOW	d88632bd-6f40-48c1-92ea-3be4bea043be	6ec48729-b324-4e3c-b114-58cd03058faf	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	8d7e87a1-2ce3-43e4-9448-dbe54fb17a16	3dd0ceeb-c3ca-4272-9c8a-88533b0e924d	2026-02-27 10:15:42.463	2026-03-01 06:15:42.463	f	\N	\N	\N	2026-02-27 06:20:11.951	\N	\N	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-27 06:15:42.467	2026-02-27 06:20:11.969	{/uploads/attachments-1772172942423.png,/uploads/attachments-1772172942433.png,/uploads/transcript_INC-0003_1772173170724.txt,/uploads/transcript_INC-0003_1772173211964.txt}
\.


--
-- Data for Name: TicketActivity; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."TicketActivity" (id, "ticketId", "actorId", action, "oldValue", "newValue", "createdAt") FROM stdin;
de35fa39-a519-4760-b16a-3f95583585f6	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	CREATED	\N	INC-0001	2026-02-26 19:56:35.957
e242ad45-2a7e-4302-b74e-07afb94e1bdf	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	ASSIGNED	\N	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-26 19:56:55.183
a1090445-55cd-4414-8123-e5b546748d53	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	STATUS_CHANGED	OPEN	IN_PROGRESS	2026-02-26 19:57:00.458
90edc9bf-85a9-4e89-a9d8-53c95266a331	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	COMMENT_ADDED	\N	work in progress	2026-02-26 19:57:19.55
e088f497-2def-47cc-8806-6f92b513d5eb	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	STATUS_CHANGED	IN_PROGRESS	RESOLVED	2026-02-26 19:57:36.174
54175e0f-acf7-48a0-9d81-1069353c6620	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	COMMENT_ADDED	\N	issue resolved	2026-02-26 19:57:43.23
1b7bf9c8-e703-40bd-a987-a3611904a5fd	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	CREATED	\N	INC-0002	2026-02-27 05:55:34.861
f5cb9fcf-820b-4894-b62c-04d41cfe96b5	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	COMMENT_ADDED	\N	test ticket to test attachment	2026-02-27 05:56:16.983
87bb12e6-33ac-4513-adf9-c5ffedc125b2	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	ASSIGNED	\N	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-27 05:57:13.312
dc6de857-7cac-4a9b-9984-8371663b954e	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	COMMENT_ADDED	\N	initiating the ticket\n	2026-02-27 05:57:37.227
e47cc94e-42a0-4edc-8211-86beb22ba9a2	c2bae5f2-240a-4abf-aee0-1bb12af11aee	6ec48729-b324-4e3c-b114-58cd03058faf	STATUS_CHANGED	OPEN	IN_PROGRESS	2026-02-27 05:58:49.088
ab713a9c-a8d6-4578-a176-1c79ee98a166	c2bae5f2-240a-4abf-aee0-1bb12af11aee	6ec48729-b324-4e3c-b114-58cd03058faf	COMMENT_ADDED	\N	wip	2026-02-27 05:59:00.174
2d74a365-6cb4-4fc2-85a3-c100ccb70d72	e72e698a-c8b3-425b-a596-4f21749122c0	d88632bd-6f40-48c1-92ea-3be4bea043be	CREATED	\N	INC-0003	2026-02-27 06:15:42.529
4e46310a-791b-4570-80f1-cb9b5ac47ba4	e72e698a-c8b3-425b-a596-4f21749122c0	d88632bd-6f40-48c1-92ea-3be4bea043be	ASSIGNED	\N	6ec48729-b324-4e3c-b114-58cd03058faf	2026-02-27 06:16:03.712
69c3e7f9-fab7-43e9-929f-79bb89c12c35	e72e698a-c8b3-425b-a596-4f21749122c0	d88632bd-6f40-48c1-92ea-3be4bea043be	COMMENT_ADDED	\N	fix	2026-02-27 06:16:14.983
7308d664-0c13-4de1-808a-c0531cc210a9	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	STATUS_CHANGED	OPEN	IN_PROGRESS	2026-02-27 06:18:17.964
e5d72054-8083-492f-bab1-646408afb991	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	COMMENT_ADDED	\N	working on it	2026-02-27 06:18:28.094
8eac2fbf-6f3c-4355-b55c-4335bc102958	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	STATUS_CHANGED	IN_PROGRESS	RESOLVED	2026-02-27 06:19:30.742
c3cf37ef-696d-4f93-84a4-a8c3a92603b5	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	STATUS_CHANGED	RESOLVED	OPEN	2026-02-27 06:20:03.291
e5d70965-f509-4d34-873a-c793ddfb010b	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	STATUS_CHANGED	OPEN	RESOLVED	2026-02-27 06:20:11.981
\.


--
-- Data for Name: TicketCategoryModel; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."TicketCategoryModel" (id, name, "ticketType", "teamId", "organizationId", "createdAt", "updatedAt") FROM stdin;
c414f79b-0cd7-423d-9435-50b027f662bd	Cloud Operations	INCIDENT	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:49:28.104	2026-02-26 19:49:28.104
1854e199-9a9c-41ce-8474-eb02204cdf43	Cloud Operations-sr	SERVICE_REQUEST	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-26 19:49:57.602	2026-02-26 19:49:57.602
8d7e87a1-2ce3-43e4-9448-dbe54fb17a16	Devops	INCIDENT	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-27 05:29:51.956	2026-02-27 05:29:51.956
246aff6d-03a8-44e8-b70c-9f2c3d3cf43e	Devops-sr	SERVICE_REQUEST	9834e92f-1cfd-4d9e-9493-cbed0cfb3070	06eb6b0c-b11a-442d-a525-7136f5f41eaf	2026-02-27 05:30:34.995	2026-02-27 05:30:34.995
\.


--
-- Data for Name: TicketComment; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."TicketComment" (id, "ticketId", "authorId", body, "isInternal", "createdAt", "updatedAt") FROM stdin;
7f649417-b74b-4b99-8bb3-2097b1463434	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	work in progress	f	2026-02-26 19:57:19.541	2026-02-26 19:57:19.541
806523ca-db2e-4940-82ed-c4148de2bc2e	0b288137-d104-435f-b98e-6aa5b404a1f2	d88632bd-6f40-48c1-92ea-3be4bea043be	issue resolved	f	2026-02-26 19:57:43.223	2026-02-26 19:57:43.223
bbb69a4b-525f-473d-8a34-05afb691c18c	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	test ticket to test attachment	f	2026-02-27 05:56:16.972	2026-02-27 05:56:16.972
4374bf8e-95ac-4790-bcc4-623da6e12b1a	c2bae5f2-240a-4abf-aee0-1bb12af11aee	d88632bd-6f40-48c1-92ea-3be4bea043be	initiating the ticket\n	f	2026-02-27 05:57:37.217	2026-02-27 05:57:37.217
2d48307e-0a1b-49fa-9c1f-c94dad21318b	c2bae5f2-240a-4abf-aee0-1bb12af11aee	6ec48729-b324-4e3c-b114-58cd03058faf	wip	f	2026-02-27 05:59:00.148	2026-02-27 05:59:00.148
3bc3933b-ce5f-4722-849e-4dc600f90ebe	e72e698a-c8b3-425b-a596-4f21749122c0	d88632bd-6f40-48c1-92ea-3be4bea043be	fix	f	2026-02-27 06:16:14.974	2026-02-27 06:16:14.974
a928de3a-bf58-45d4-b511-e816949ff852	e72e698a-c8b3-425b-a596-4f21749122c0	6ec48729-b324-4e3c-b114-58cd03058faf	working on it	f	2026-02-27 06:18:28.084	2026-02-27 06:18:28.084
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."User" (id, email, password, name, "organizationId", "roleId", "bandId", "LegacyRole", designation, "profilePictureUrl", "bloodGroup", address, "departmentId", "managerId", "createdAt", "updatedAt", "employeeId", skills, dob, latitude, longitude, "permanentAddress", "personalEmail", "presentAddress", "isActive", "exitDate", "exitReason", "exitNotes", "assignedOfficeId", "panNumber", ufn, "bankName", "bankAccountNumber", "ifscCode", "taxRegime", "mustChangePassword") FROM stdin;
037e176f-5e7c-4ad3-b388-537bec8a1888	admin@bigwig.local	$2b$12$ivydIdk5Q4jvYPp2c/7y.uN7c25VTmK7ULPULhKm3fLmZejbsZiOy	Admin	06eb6b0c-b11a-442d-a525-7136f5f41eaf	98bf5e26-175c-45af-8d0d-38f8ecf2452a	\N	ADMIN	Administrator	\N	\N	\N	\N	\N	2026-02-27 05:51:06.648	2026-02-27 05:51:06.648	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	NEW	t
6ec48729-b324-4e3c-b114-58cd03058faf	digvijay.singh@bigwig.local	$2b$12$hE/.9agK0duQ57Md8g3QhOmWwsInNvV9mGl6RiGJz2DSrIYq7HfFm	Digvijay Singh	06eb6b0c-b11a-442d-a525-7136f5f41eaf	52e45980-7ca6-47db-b080-44143743f496	43ea3243-5051-49cd-a3cf-e5201f1825a8	EMPLOYEE	Cloudops	/uploads/profiles/profilePic-1771999710952-430674690.jpeg	AB+		0ce780d1-05ba-46a2-b4e0-6c9a691b5344	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-25 06:08:31.168	2026-02-25 06:09:07.842	B00003	{}	1984-01-21 00:00:00	\N	\N		digvijay.singh@gmail.com		t	\N	\N	\N	ac5d5f8d-ee80-41b2-8e07-4caa6331630c	\N	\N	\N	\N	\N	NEW	t
d88632bd-6f40-48c1-92ea-3be4bea043be	suramyac@bigwig.local	$2b$12$vCMpslkix9q2ufQKR0pO7uemnm9toiOO9vxo1wVW5WrhOX58dCrSK	Suramya Chaudhary	06eb6b0c-b11a-442d-a525-7136f5f41eaf	98bf5e26-175c-45af-8d0d-38f8ecf2452a	\N	ADMIN	Director	\N	O+		0ce780d1-05ba-46a2-b4e0-6c9a691b5344	\N	2026-02-24 07:29:54.935	2026-02-24 07:41:11.971	B00001	{}	2000-01-01 00:00:00	\N	\N				t	\N	\N	\N	ac5d5f8d-ee80-41b2-8e07-4caa6331630c	\N	\N	\N	\N	\N	NEW	t
f02680be-4fe3-492a-b315-e0a07d1c7d25	raj.mohan@bigwig.local	$2b$12$oIDqpdZ0gOxsN2kgFRnp.OvlcQuhrFoLwUJS.P.H9knmiQyyj7N8O	RajMohan Bharathi	06eb6b0c-b11a-442d-a525-7136f5f41eaf	98bf5e26-175c-45af-8d0d-38f8ecf2452a	8d7f163e-87b7-446a-8e34-be676651bf0e	EMPLOYEE	DOE - Platform Operations	/uploads/profiles/profilePic-1771918804155-208213594.png	O+		0ce780d1-05ba-46a2-b4e0-6c9a691b5344	d88632bd-6f40-48c1-92ea-3be4bea043be	2026-02-24 07:40:04.651	2026-02-26 19:32:02.556	B00002	{AWS,Azure,"Cloud Operations","Team Management","Cloud Complaince"}	2025-09-15 00:00:00	\N	\N	Q2-703, Solacia Phase-2, Baif Road, Wagholi, Pune, Maharashtra - 412207	rajmohanb.gcp@gmail.com	M1005, 10th Floor, Tower-M, Rof Alyaas -2, Sector -102, Gurugram, Haryana - 122006	t	\N	\N	\N	ac5d5f8d-ee80-41b2-8e07-4caa6331630c	\N	\N	\N	\N	\N	NEW	t
\.


--
-- Data for Name: WFHLocation; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."WFHLocation" (id, address, latitude, longitude, status, "userId", "createdAt", "updatedAt") FROM stdin;
3b200865-2587-4ba1-9396-adce4280c282	Q2-703, Solacia Phase-2, Baif Road, Wagholi, Punr, MH - 412207	18.5712024	73.9753769	APPROVED	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-25 05:07:46.96	2026-02-25 05:08:21.081
4ad1f757-6acd-4625-8bda-7cd02bcb12b0	Q2-703, Solacia Phase-2, Baif Road, Wagholi, Pune, MH - 412207	18.5729024	73.9704832	APPROVED	f02680be-4fe3-492a-b315-e0a07d1c7d25	2026-02-26 06:20:31.496	2026-02-26 06:20:57.555
\.


--
-- Data for Name: WorkExperience; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."WorkExperience" (id, "companyName", designation, "startDate", "endDate", description, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c5d55d37-fbb1-42b5-a28e-0bdafcb96377	bfece2d84963b8616a634070bb5ffbd885874b041ad529a81372f4c8cc69bbd8	2026-02-24 05:08:40.669559+00	20260214035458_init_chat	\N	\N	2026-02-24 05:08:40.430725+00	1
7e84525a-449e-4d24-9c27-f36245cdb24e	59a16196c30cbc6b66d8e690ffc6aec013909aa15f4bcccef17dbda9d4424eb2	2026-02-25 03:25:38.9811+00	20260225000000_add_bank_tax_fields	\N	\N	2026-02-25 03:25:38.972604+00	1
ada15437-460d-474a-8e58-074530353d38	272adc97b506b7969dbbb3e52736438dc426748725a63cb1c81f3c353c7aff9a	2026-02-24 05:08:40.681578+00	20260214083949_add_chat_status_fields	\N	\N	2026-02-24 05:08:40.672553+00	1
529500c7-c2e7-4c6b-92a6-b8327ed17229	194d0847ff7fda0faba17bc1fd253cf71f17c0c874fdba4f50a03ade95f416aa	2026-02-24 05:08:40.757009+00	20260218023940_add_org_config_access	\N	\N	2026-02-24 05:08:40.684274+00	1
3d57a0d7-4932-4af7-9dc5-9ba52bbed1d2	5c9a8b34ebfff36898a91ee8a9a42c099e107dc54051b2acced48bf8e944a511	2026-02-24 05:08:40.806215+00	20260218045230_add_onboarding_models	\N	\N	2026-02-24 05:08:40.760156+00	1
2faca0de-ebe0-4939-aef9-1cf539524d23	9a2150f2b2da8603f2213b3ef20d52fe1464930c707240b069f2e23f98bcadb4	2026-02-26 06:43:06.264967+00	20260226000000_appraisal_cycle_enhancement	\N	\N	2026-02-26 06:43:06.253807+00	1
2add432e-a73c-481b-9a6e-98a81d9ff267	8b56bb082fd11211bde3668958cafe47c12bfeac05f153da7b9251cec9047b58	2026-02-24 05:08:40.911088+00	20260218070248_add_tas_models	\N	\N	2026-02-24 05:08:40.80897+00	1
66377e53-0537-4220-bb9e-13fbbaadb7a9	6e3e9b73f8f3c34bb757817f2d7fb477adaacb54e90d16552923ef44aec63f05	2026-02-24 05:08:40.94098+00	20260218085504_add_analysis_report	\N	\N	2026-02-24 05:08:40.914861+00	1
94fffb6f-f6f9-48f2-8878-d7f0f445bcf6	5d1aaaa553a90ab9fa549c5b50b41bd3db1855781bcc523bd7810610dd7ffc86	2026-02-24 05:08:41.018281+00	20260218131543_add_appraisal_cycle	\N	\N	2026-02-24 05:08:40.944622+00	1
61ac71fe-0e02-4304-98e0-c1dbeaafe5ae	ce4d302e31eb9712d2d9b91ea7df5e815c2adcb0d751eb60ce92d66fa68f04ac	2026-02-24 05:08:41.030719+00	20260219030000_add_is_active	\N	\N	2026-02-24 05:08:41.02076+00	1
f41acdaf-ed58-47ab-86e9-0cab1a074f8e	dcd15a752025acbef0caf91eed58fa650c69907a99dd4e9c5deefe5087ffb473	2026-02-24 05:08:41.045488+00	20260219031000_add_offboarding_fields	\N	\N	2026-02-24 05:08:41.033598+00	1
3ce31e2a-76f0-49f4-95cb-5e703d87fc47	f8c18b824b5ab28b41939074d6bf6bc64a13d784e79e9b99c5643dee51fd6532	2026-02-24 05:08:41.066892+00	20260219050000_add_org_branding	\N	\N	2026-02-24 05:08:41.049318+00	1
4577708a-d270-45ef-90b7-73c3227f2e81	6a983dc0643c2f1f3044738e8d2218cb495d5a97fb2dfe68d0f7a128d03d8ee7	2026-02-24 05:08:41.092316+00	20260220041500_add_department_description_org	\N	\N	2026-02-24 05:08:41.069456+00	1
5353cd35-4ba7-4f0a-a13d-20a72480740a	6bfbad385e8085bbfaebaeba572d37a5d2de3b380bbc726591a2aae98360cc1f	2026-02-24 05:08:41.107423+00	20260220_add_org_contact_gst	\N	\N	2026-02-24 05:08:41.095643+00	1
a3081b8c-825e-44f5-84f4-e69ca2f3dee1	9ed39e9681814002e3f938622ee5976645100246820ec953082c0fdf656490b8	2026-02-24 05:08:42.953843+00	20260224050842_multi_office_asset_updates	\N	\N	2026-02-24 05:08:42.897503+00	1
eb0a65b6-a275-47c4-add2-0e0edb3f09b4	81afc9d2bf7a602b251db7bdb971859abe9c67e4bee4687fef7d599d8f0e5837	2026-02-26 19:20:28.757371+00	20260227000000_add_servicedesk_itsm	\N	\N	2026-02-26 19:20:27.757371+00	1
157fed11-22a4-4821-8b70-297d8d41382d	7a9c7b31e9b0405a72cd6ed4661c3608d32b8402473c5e00c9c5d4310524454d	2026-02-27 05:02:19.363446+00	20260227103100_add_must_change_password	\N	\N	2026-02-27 05:02:19.322451+00	1
0d915e6c-08b2-49ea-8425-d86c4effbcfb	8675cfeb7413dd48e86312a97a15092b410b1fc0363c2b7c364f7ed9aba57b81	2026-02-27 05:51:05.811052+00	20260227110900_add_ticket_attachments	\N	\N	2026-02-27 05:51:05.789541+00	1
\.


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: AppraisalCycle AppraisalCycle_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalCycle"
    ADD CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY (id);


--
-- Name: AppraisalGoal AppraisalGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalGoal"
    ADD CONSTRAINT "AppraisalGoal_pkey" PRIMARY KEY (id);


--
-- Name: AppraisalReview AppraisalReview_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalReview"
    ADD CONSTRAINT "AppraisalReview_pkey" PRIMARY KEY (id);


--
-- Name: Assessment Assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: Band Band_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Band"
    ADD CONSTRAINT "Band_pkey" PRIMARY KEY (id);


--
-- Name: CMDBItem CMDBItem_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CMDBItem"
    ADD CONSTRAINT "CMDBItem_pkey" PRIMARY KEY (id);


--
-- Name: CMDBRelationship CMDBRelationship_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CMDBRelationship"
    ADD CONSTRAINT "CMDBRelationship_pkey" PRIMARY KEY (id);


--
-- Name: Candidate Candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (id);


--
-- Name: Certification Certification_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Certification"
    ADD CONSTRAINT "Certification_pkey" PRIMARY KEY (id);


--
-- Name: ChangeActivity ChangeActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeActivity"
    ADD CONSTRAINT "ChangeActivity_pkey" PRIMARY KEY (id);


--
-- Name: ChangeApproval ChangeApproval_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeApproval"
    ADD CONSTRAINT "ChangeApproval_pkey" PRIMARY KEY (id);


--
-- Name: ChangeComment ChangeComment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeComment"
    ADD CONSTRAINT "ChangeComment_pkey" PRIMARY KEY (id);


--
-- Name: ChangeRequestCI ChangeRequestCI_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequestCI"
    ADD CONSTRAINT "ChangeRequestCI_pkey" PRIMARY KEY (id);


--
-- Name: ChangeRequest ChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: ConversationParticipant ConversationParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_name_organizationId_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_name_organizationId_key" UNIQUE (name, "organizationId");


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: HikeAllocation HikeAllocation_cycleId_userId_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."HikeAllocation"
    ADD CONSTRAINT "HikeAllocation_cycleId_userId_key" UNIQUE ("cycleId", "userId");


--
-- Name: HikeAllocation HikeAllocation_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."HikeAllocation"
    ADD CONSTRAINT "HikeAllocation_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: Interview Interview_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_pkey" PRIMARY KEY (id);


--
-- Name: JobPosting JobPosting_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."JobPosting"
    ADD CONSTRAINT "JobPosting_pkey" PRIMARY KEY (id);


--
-- Name: KEDBEntry KEDBEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."KEDBEntry"
    ADD CONSTRAINT "KEDBEntry_pkey" PRIMARY KEY (id);


--
-- Name: LeaveBalance LeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: LeavePolicy LeavePolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LeavePolicy"
    ADD CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY (id);


--
-- Name: Leave Leave_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Leave"
    ADD CONSTRAINT "Leave_pkey" PRIMARY KEY (id);


--
-- Name: MessageReadStatus MessageReadStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."MessageReadStatus"
    ADD CONSTRAINT "MessageReadStatus_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OffboardingRequest OffboardingRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OffboardingRequest"
    ADD CONSTRAINT "OffboardingRequest_pkey" PRIMARY KEY (id);


--
-- Name: OffboardingRequest OffboardingRequest_userId_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OffboardingRequest"
    ADD CONSTRAINT "OffboardingRequest_userId_key" UNIQUE ("userId");


--
-- Name: Offer Offer_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY (id);


--
-- Name: OfficeVisitRequest OfficeVisitRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OfficeVisitRequest"
    ADD CONSTRAINT "OfficeVisitRequest_pkey" PRIMARY KEY (id);


--
-- Name: Office Office_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Office"
    ADD CONSTRAINT "Office_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: PayrollRecord PayrollRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PayrollRecord"
    ADD CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY (id);


--
-- Name: Payroll Payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_pkey" PRIMARY KEY (id);


--
-- Name: Performance Performance_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_pkey" PRIMARY KEY (id);


--
-- Name: ProblemActivity ProblemActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ProblemActivity"
    ADD CONSTRAINT "ProblemActivity_pkey" PRIMARY KEY (id);


--
-- Name: Problem Problem_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Problem"
    ADD CONSTRAINT "Problem_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Roster Roster_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_pkey" PRIMARY KEY (id);


--
-- Name: SLAPolicy SLAPolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."SLAPolicy"
    ADD CONSTRAINT "SLAPolicy_pkey" PRIMARY KEY (id);


--
-- Name: SalaryStructure SalaryStructure_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."SalaryStructure"
    ADD CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY (id);


--
-- Name: ServiceDeskCounter ServiceDeskCounter_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ServiceDeskCounter"
    ADD CONSTRAINT "ServiceDeskCounter_pkey" PRIMARY KEY (id);


--
-- Name: ServiceDeskMember ServiceDeskMember_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ServiceDeskMember"
    ADD CONSTRAINT "ServiceDeskMember_pkey" PRIMARY KEY (id);


--
-- Name: ServiceDeskTeam ServiceDeskTeam_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ServiceDeskTeam"
    ADD CONSTRAINT "ServiceDeskTeam_pkey" PRIMARY KEY (id);


--
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY (id);


--
-- Name: Skill Skill_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_pkey" PRIMARY KEY (id);


--
-- Name: TeamBudget TeamBudget_cycleId_managerId_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TeamBudget"
    ADD CONSTRAINT "TeamBudget_cycleId_managerId_key" UNIQUE ("cycleId", "managerId");


--
-- Name: TeamBudget TeamBudget_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TeamBudget"
    ADD CONSTRAINT "TeamBudget_pkey" PRIMARY KEY (id);


--
-- Name: TicketActivity TicketActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketActivity"
    ADD CONSTRAINT "TicketActivity_pkey" PRIMARY KEY (id);


--
-- Name: TicketCategoryModel TicketCategoryModel_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketCategoryModel"
    ADD CONSTRAINT "TicketCategoryModel_pkey" PRIMARY KEY (id);


--
-- Name: TicketComment TicketComment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WFHLocation WFHLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."WFHLocation"
    ADD CONSTRAINT "WFHLocation_pkey" PRIMARY KEY (id);


--
-- Name: WorkExperience WorkExperience_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."WorkExperience"
    ADD CONSTRAINT "WorkExperience_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AppraisalCycle_quarter_year_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "AppraisalCycle_quarter_year_key" ON public."AppraisalCycle" USING btree (quarter, year);


--
-- Name: AppraisalReview_cycleId_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "AppraisalReview_cycleId_userId_key" ON public."AppraisalReview" USING btree ("cycleId", "userId");


--
-- Name: Asset_assetId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Asset_assetId_key" ON public."Asset" USING btree ("assetId");


--
-- Name: Asset_serialNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Asset_serialNumber_key" ON public."Asset" USING btree ("serialNumber");


--
-- Name: Band_name_organizationId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Band_name_organizationId_key" ON public."Band" USING btree (name, "organizationId");


--
-- Name: CMDBItem_ciNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "CMDBItem_ciNumber_key" ON public."CMDBItem" USING btree ("ciNumber");


--
-- Name: CMDBRelationship_sourceId_targetId_relationshipType_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "CMDBRelationship_sourceId_targetId_relationshipType_key" ON public."CMDBRelationship" USING btree ("sourceId", "targetId", "relationshipType");


--
-- Name: Candidate_email_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Candidate_email_key" ON public."Candidate" USING btree (email);


--
-- Name: ChangeApproval_changeRequestId_approverId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ChangeApproval_changeRequestId_approverId_key" ON public."ChangeApproval" USING btree ("changeRequestId", "approverId");


--
-- Name: ChangeRequestCI_changeRequestId_ciId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ChangeRequestCI_changeRequestId_ciId_key" ON public."ChangeRequestCI" USING btree ("changeRequestId", "ciId");


--
-- Name: ChangeRequest_changeNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ChangeRequest_changeNumber_key" ON public."ChangeRequest" USING btree ("changeNumber");


--
-- Name: ConversationParticipant_conversationId_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON public."ConversationParticipant" USING btree ("conversationId", "userId");


--
-- Name: KEDBEntry_problemId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "KEDBEntry_problemId_key" ON public."KEDBEntry" USING btree ("problemId");


--
-- Name: LeaveBalance_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "LeaveBalance_userId_key" ON public."LeaveBalance" USING btree ("userId");


--
-- Name: LeavePolicy_organizationId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "LeavePolicy_organizationId_key" ON public."LeavePolicy" USING btree ("organizationId");


--
-- Name: MessageReadStatus_messageId_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "MessageReadStatus_messageId_userId_key" ON public."MessageReadStatus" USING btree ("messageId", "userId");


--
-- Name: Organization_ownerId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Organization_ownerId_key" ON public."Organization" USING btree ("ownerId");


--
-- Name: PayrollRecord_userId_month_year_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "PayrollRecord_userId_month_year_key" ON public."PayrollRecord" USING btree ("userId", month, year);


--
-- Name: Problem_problemNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Problem_problemNumber_key" ON public."Problem" USING btree ("problemNumber");


--
-- Name: Role_name_organizationId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Role_name_organizationId_key" ON public."Role" USING btree (name, "organizationId");


--
-- Name: Roster_userId_date_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Roster_userId_date_key" ON public."Roster" USING btree ("userId", date);


--
-- Name: SalaryStructure_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "SalaryStructure_userId_key" ON public."SalaryStructure" USING btree ("userId");


--
-- Name: ServiceDeskCounter_prefix_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ServiceDeskCounter_prefix_key" ON public."ServiceDeskCounter" USING btree (prefix);


--
-- Name: ServiceDeskMember_teamId_userId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ServiceDeskMember_teamId_userId_key" ON public."ServiceDeskMember" USING btree ("teamId", "userId");


--
-- Name: ServiceDeskTeam_name_organizationId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "ServiceDeskTeam_name_organizationId_key" ON public."ServiceDeskTeam" USING btree (name, "organizationId");


--
-- Name: TicketCategoryModel_name_organizationId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "TicketCategoryModel_name_organizationId_key" ON public."TicketCategoryModel" USING btree (name, "organizationId");


--
-- Name: Ticket_ticketNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_employeeId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "User_employeeId_key" ON public."User" USING btree ("employeeId");


--
-- Name: Application Application_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPosting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AppraisalGoal AppraisalGoal_cycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalGoal"
    ADD CONSTRAINT "AppraisalGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES public."AppraisalCycle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AppraisalGoal AppraisalGoal_setById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalGoal"
    ADD CONSTRAINT "AppraisalGoal_setById_fkey" FOREIGN KEY ("setById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AppraisalGoal AppraisalGoal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalGoal"
    ADD CONSTRAINT "AppraisalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AppraisalReview AppraisalReview_cycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalReview"
    ADD CONSTRAINT "AppraisalReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES public."AppraisalCycle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AppraisalReview AppraisalReview_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalReview"
    ADD CONSTRAINT "AppraisalReview_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AppraisalReview AppraisalReview_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AppraisalReview"
    ADD CONSTRAINT "AppraisalReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Asset Asset_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_officeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES public."Office"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_officeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES public."Office"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Attendance Attendance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Band Band_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Band"
    ADD CONSTRAINT "Band_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CMDBRelationship CMDBRelationship_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CMDBRelationship"
    ADD CONSTRAINT "CMDBRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."CMDBItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CMDBRelationship CMDBRelationship_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CMDBRelationship"
    ADD CONSTRAINT "CMDBRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."CMDBItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Certification Certification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Certification"
    ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChangeActivity ChangeActivity_changeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeActivity"
    ADD CONSTRAINT "ChangeActivity_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChangeApproval ChangeApproval_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeApproval"
    ADD CONSTRAINT "ChangeApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChangeApproval ChangeApproval_changeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeApproval"
    ADD CONSTRAINT "ChangeApproval_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChangeComment ChangeComment_changeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeComment"
    ADD CONSTRAINT "ChangeComment_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChangeRequestCI ChangeRequestCI_changeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequestCI"
    ADD CONSTRAINT "ChangeRequestCI_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChangeRequestCI ChangeRequestCI_ciId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequestCI"
    ADD CONSTRAINT "ChangeRequestCI_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES public."CMDBItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChangeRequest ChangeRequest_assignmentGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequest ChangeRequest_implementerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_implementerId_fkey" FOREIGN KEY ("implementerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ConversationParticipant ConversationParticipant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConversationParticipant ConversationParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Department Department_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Document Document_workExperienceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_workExperienceId_fkey" FOREIGN KEY ("workExperienceId") REFERENCES public."WorkExperience"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Holiday Holiday_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Interview Interview_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Interview Interview_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JobPosting JobPosting_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."JobPosting"
    ADD CONSTRAINT "JobPosting_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: KEDBEntry KEDBEntry_problemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."KEDBEntry"
    ADD CONSTRAINT "KEDBEntry_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES public."Problem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeaveBalance LeaveBalance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeavePolicy LeavePolicy_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LeavePolicy"
    ADD CONSTRAINT "LeavePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Leave Leave_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Leave"
    ADD CONSTRAINT "Leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageReadStatus MessageReadStatus_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."MessageReadStatus"
    ADD CONSTRAINT "MessageReadStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageReadStatus MessageReadStatus_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."MessageReadStatus"
    ADD CONSTRAINT "MessageReadStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OffboardingRequest OffboardingRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OffboardingRequest"
    ADD CONSTRAINT "OffboardingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OfficeVisitRequest OfficeVisitRequest_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OfficeVisitRequest"
    ADD CONSTRAINT "OfficeVisitRequest_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OfficeVisitRequest OfficeVisitRequest_targetOfficeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OfficeVisitRequest"
    ADD CONSTRAINT "OfficeVisitRequest_targetOfficeId_fkey" FOREIGN KEY ("targetOfficeId") REFERENCES public."Office"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OfficeVisitRequest OfficeVisitRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."OfficeVisitRequest"
    ADD CONSTRAINT "OfficeVisitRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Office Office_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Office"
    ADD CONSTRAINT "Office_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayrollRecord PayrollRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PayrollRecord"
    ADD CONSTRAINT "PayrollRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payroll Payroll_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Performance Performance_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Performance Performance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProblemActivity ProblemActivity_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ProblemActivity"
    ADD CONSTRAINT "ProblemActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProblemActivity ProblemActivity_problemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ProblemActivity"
    ADD CONSTRAINT "ProblemActivity_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES public."Problem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Problem Problem_assignmentGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Problem"
    ADD CONSTRAINT "Problem_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Problem Problem_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Problem"
    ADD CONSTRAINT "Problem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."TicketCategoryModel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Role Role_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Roster Roster_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Roster Roster_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalaryStructure SalaryStructure_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."SalaryStructure"
    ADD CONSTRAINT "SalaryStructure_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ServiceDeskMember ServiceDeskMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ServiceDeskMember"
    ADD CONSTRAINT "ServiceDeskMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."ServiceDeskTeam"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Skill Skill_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeamBudget TeamBudget_cycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TeamBudget"
    ADD CONSTRAINT "TeamBudget_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES public."AppraisalCycle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketActivity TicketActivity_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketActivity"
    ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketCategoryModel TicketCategoryModel_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketCategoryModel"
    ADD CONSTRAINT "TicketCategoryModel_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."ServiceDeskTeam"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketComment TicketComment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."TicketCategoryModel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_changeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES public."ChangeRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_ciId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES public."CMDBItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_problemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES public."Problem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_slaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_slaId_fkey" FOREIGN KEY ("slaId") REFERENCES public."SLAPolicy"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."ServiceDeskTeam"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_assignedOfficeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_assignedOfficeId_fkey" FOREIGN KEY ("assignedOfficeId") REFERENCES public."Office"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_bandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES public."Band"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WFHLocation WFHLocation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."WFHLocation"
    ADD CONSTRAINT "WFHLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkExperience WorkExperience_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."WorkExperience"
    ADD CONSTRAINT "WorkExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict lLNgsMXNmaqkOnd4QrTrYwgxAWdgHfypyuDzLsLEw8lSFyofPWO941ZSaWG6B3g

