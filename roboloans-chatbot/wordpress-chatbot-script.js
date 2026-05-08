// Roboloans Chatbot - Complete botv1.html Flow
(function($) {
    'use strict';
    
    let isDataSent = false,
        isKnockedOut = false,
        inputLocked = false,
        currentStepId = "",
        loanCount = 0,
        cardCount = 0;
    
    const answers = {},
          historyStack = [];
    
    let chatMessages, inputArea, chatInput, inputHint, 
        progressFill, progressLabel, progressPct;
    
    // Complete flow from botv1.html
    const flow = [
        {id:"s1",type:"section",text:"Part 1 of 3 — Eligibility Check"},
        {id:"welcome",type:"bot",text:"Hey! <span class='emoji'>👋</span> I can help you check if you're eligible and give you a rough idea of your borrowing power.\n\nIt's quick and won't affect your credit file at all."},
        {id:"name",type:"text",text:"First up, what's your full name?",placeholder:"e.g. John Smith",key:"Full_Name",validate:v=>v.trim().length>=2?null:"Please enter your full name"},
        {id:"email",type:"email",text:"Thanks {name}! What's the best email to send your quote and results to?",placeholder:"e.g. john@email.com",key:"Email",validate:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?null:"Please enter a valid email address"},
        {id:"licence",type:"buttons",text:"Do you have an Australian driver's licence?",key:"Has_Licence",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"licence_state":"licence_no_msg"},
        {id:"licence_no_msg",type:"bot",text:"No worries. I'll keep that in mind for later. We can usually work with other ID like a passport.",next:()=>"residency"},
        {id:"licence_state",type:"buttons",text:"Nice. Which state is it in?",key:"Which_State_Licence",options:[{l:"NSW",v:"NSW"},{l:"VIC",v:"VIC"},{l:"QLD",v:"QLD"},{l:"WA",v:"WA"},{l:"NT",v:"NT"},{l:"ACT",v:"ACT"},{l:"TAS",v:"TAS"},{l:"SA",v:"SA"}]},
        {id:"licence_type",type:"buttons",text:"What type of licence do you have?",key:"Licence_Type",options:[{l:"Full",v:"Full"},{l:"Provisional",v:"Provisional"},{l:"Learner",v:"Learner"}]},
        {id:"residency",type:"buttons",text:"Just confirming your residency — which one fits you best?",key:"Residency",knockout:"residency",options:[{l:"Australian Citizen",v:"Australian Citizen"},{l:"Permanent Resident",v:"Permanent Resident"},{l:"Work Visa",v:"Work Visa"},{l:"Other visa",v:"Other visa (student, tourist, etc.)"}]},
        {id:"dob",type:"date",text:"What is your date of birth?",placeholder:"dd/MM/yyyy",key:"Date_of_Birth",hint:"Format: dd/MM/yyyy — e.g. 15/06/1990",knockout:"dob",validate:v=>{const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return"Please use dd/MM/yyyy format (e.g. 15/06/1990)";const day=+m[1],month=+m[2],year=+m[3];if(month<1||month>12)return"Month must be between 01 and 12";if(day<1||day>31)return"Day must be between 01 and 31";if(year<1900||year>new Date().getFullYear())return"Please enter a valid birth year";const d=new Date(year,month-1,day);if(d.getFullYear()!==year||d.getMonth()!==month-1||d.getDate()!==day)return"Invalid date — please check day/month (format: dd/MM/yyyy)";const age=(new Date()-d)/(365.25*24*3600*1000);if(age>120)return"Please enter a valid date of birth";return null;}},
        {id:"bankrupt",type:"buttons",text:"Are you currently bankrupt, or in a Part 9 debt agreement?",key:"Bankrupt_Part9",knockout:"bankrupt",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}]},
        {id:"credit_rating",type:"buttons",text:"Roughly how would you rate your credit history?",key:"Self_Rated_Credit",knockout:"credit_rating",options:[{l:"Excellent",v:"Excellent"},{l:"Good",v:"Good"},{l:"Average",v:"Average"},{l:"Poor",v:"Poor"},{l:"Terrible",v:"Terrible"},{l:"Don't know",v:"Don't know"}],next:()=>"credit_ack"},
        {id:"credit_ack",type:"bot",text:"Nice, that helps. I'll keep that in mind when we match you with lenders.",next:()=>"car_loans"},
        {id:"car_loans",type:"buttons",text:"Have you had any car loans, personal loans or home loans recently?",key:"Has_Loans",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}]},
        {id:"credit_cards",type:"buttons",text:"Do you have any credit cards at the moment?",key:"Has_Credit_Cards",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}]},
        {id:"small_loans",type:"buttons",text:"Have you had any small loans under $5,000, including payday loans?",key:"Has_Small_Loans",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}]},
        {id:"defaults",type:"buttons",text:"Are you aware of any defaults or accounts in collections? (phones, electricity, gym memberships etc.)",key:"Has_Defaults",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"},{l:"Not Sure",v:"Not Sure"}],next:()=>"defaults_ack"},
        {id:"defaults_ack",type:"bot",text:"Thanks for letting me know — this just helps me match you with the right lender. Even with a few issues, there can still be options.",next:()=>"income_type"},
        {id:"income_type",type:"buttons",text:"Which best describes your main income at the moment?",key:"Income_Type",options:[{l:"Employed (PAYG)",v:"Employed (PAYG)"},{l:"Self-employed",v:"Self-employed"},{l:"Centrelink / Govt payments",v:"Centrelink / Government payments"}],next:v=>v.startsWith("Employed")?"employment_basis":v.startsWith("Self")?"self_emp_type":"centrelink_other"},
        {id:"employment_basis",type:"buttons",text:"Nice. Are you full-time, part-time, or casual in this job?",key:"Employment_Basis",options:[{l:"Full-time",v:"Full-time"},{l:"Part-time",v:"Part-time"},{l:"Casual",v:"Casual"}],next:()=>"income_amount"},
        {id:"income_amount",type:"number",text:"Roughly what's your total take-home income?",placeholder:"e.g. 1200",key:"Income_Amount",hint:"Numbers only — no $ sign needed",validate:v=>isNaN(v)||+v<=0?"Please enter a valid amount":null},
        {id:"income_freq",type:"buttons",text:"Is that per week, per fortnight, or per month?",key:"Income_Frequency",options:[{l:"Weekly",v:"Weekly"},{l:"Fortnightly",v:"Fortnightly"},{l:"Monthly",v:"Monthly"}],next:v=>{const amt=parseFloat(answers.Income_Amount||0);const low=(v==="Weekly"&&amt<650)||(v==="Fortnightly"&&amt<1300)||(v==="Monthly"&&amt<2700);return low?"income_low":"mobile";}},
        {id:"income_low",type:"buttons",text:"Thanks for that. Based on what you've told me, your income is on the lower side for most lenders.\n\nDo you share your living expenses with a partner, or do you cover them all yourself?",key:"Share_Expenses",knockout:"income_low_self",options:[{l:"I cover everything myself",v:"I cover everything myself"},{l:"I split expenses with a partner",v:"I split expenses with a partner"}],next:()=>"income_shared_ack"},
        {id:"income_shared_ack",type:"bot",text:"Got it, that helps. Sharing expenses can improve how lenders see your situation. I'll keep that in mind when we look at your borrowing power.",next:()=>"mobile"},
        {id:"self_emp_type",type:"buttons",text:"Okay, self-employed. Which one fits you best?",key:"Self_Emp_Type",options:[{l:"Sole trader – I take drawings",v:"Sole trader"},{l:"Company director – I pay myself wages",v:"Company director"}]},
        {id:"abn_check",type:"buttons",text:"Does your business or company have an ABN?",key:"Has_ABN",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"abn_number":"income_amount"},
        {id:"abn_number",type:"text",text:"Great. What's your ABN?",placeholder:"e.g. 51 824 753 556",key:"ABN"},
        {id:"centrelink_other",type:"buttons",text:"Got it. Are you receiving any other income besides Centrelink? (e.g. part-time job or casual work)",key:"Beside_Centrelink",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"centrelink_extra":"newstart"},
        {id:"centrelink_extra",type:"text",text:"Nice, what sort of extra income is it? (e.g. part-time retail, casual warehouse)",key:"Centrelink_Extra",placeholder:"e.g. part-time retail"},
        {id:"newstart",type:"buttons",text:"And just to check — are you currently receiving Newstart or JobSeeker payments?",key:"New_Start",knockout:"newstart",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}]},
        {id:"centrelink_income_amount",type:"number",text:"Roughly what's your total take-home income (including Centrelink)?",placeholder:"e.g. 900",key:"Income_Amount",hint:"Numbers only",validate:v=>isNaN(v)||+v<=0?"Please enter a valid amount":null},
        {id:"centrelink_income_freq",type:"buttons",text:"Is that per week, per fortnight, or per month?",key:"Income_Frequency",options:[{l:"Weekly",v:"Weekly"},{l:"Fortnightly",v:"Fortnightly"},{l:"Monthly",v:"Monthly"}]},
        {id:"mobile",type:"tel",text:"Great, thanks! What's the best mobile number to send your eligibility result and quote to?",placeholder:"e.g. 0412 345 678",key:"Mobile",hint:"Australian mobile number",validate:v=>/^(\+?61|0)[2-9]\d{8}$/.test(v.replace(/\s/g,""))?null:"Please enter a valid Australian mobile number"},
        {id:"mobile_confirm",type:"buttons",text:"So just confirming, your mobile number is {mobile} — is that right?",key:"Mobile_Check",options:[{l:"Yes, that's correct",v:"Yes"},{l:"No, let me fix it",v:"No"}],next:v=>v==="No"?"mobile":"checking_pause"},
        {id:"checking_pause",type:"bot",text:"Alright, give me a second while I check this against our lenders in the background… ⏳",pauseMs:2000,next:()=>"consent_intro"},
        {id:"consent_intro",type:"bot",text:"Last thing before I show you what you might qualify for — I just need your okay on our Privacy Consent so we can review your details properly and, if needed, check your information with our lender partners."},
        {id:"signature",type:"signature",text:"✍️ Please sign below to confirm your privacy consent:"},
        {id:"eligible_msg",type:"bot",text:"Perfect, thanks {name}. You're eligible to move forward! ✅\n\nNext, I'll ask a few more quick questions so I can estimate your borrowing power and repayments. This is still just a quote and won't affect your credit file.\n\nLet's start with where you live."},
        {id:"s2",type:"section",text:"Part 2 of 3 — Personal Details"},
        {id:"relationship",type:"buttons",text:"What's your current relationship status?",key:"Relationship",options:[{l:"Single",v:"Single"},{l:"De facto",v:"De facto"},{l:"Married",v:"Married"},{l:"Separated",v:"Separated"}]},
        {id:"children",type:"buttons",text:"Do you have any children or dependants you support?",key:"Children",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"children_no":"current_address"},
        {id:"children_no",type:"number",text:"How many children or dependants do you have?",placeholder:"e.g. 2",key:"Children_No",validate:v=>/^\d+$/.test(v)&&+v>0?null:"Please enter a valid number"},
        {id:"children_ages",type:"text",text:"And roughly what are their ages? You need to enter {childCount} age(s). (e.g. 3, 7 and 12)",placeholder:"Enter all ages separated by commas",key:"Children_Ages",hint:"List every child's age — e.g. 3, 7 and 12",validate:v=>{const count=parseInt(answers.Children_No||"0");const parts=v.split(/[\s,]+(?:and[\s,]+)?|[\s,]*\band\b[\s,]*/i).map(s=>s.trim()).filter(s=>s!==""&&!isNaN(s)&&+s>=0);if(parts.length!==count)return"You entered "+count+" children — please provide "+count+" age"+(count>1?"s":"")+". (e.g. 3, 7 and 12)";return null;}},
        {id:"current_address",type:"text",text:"Where are you currently living?",placeholder:"Enter your full Australian address",key:"Current_Address"},
        {id:"living_situation",type:"buttons",text:"Thanks! What best describes your current living situation?",key:"Address_Types",options:[{l:"Renting",v:"Renting"},{l:"Own home (mortgage)",v:"Own the home (with a mortgage)"},{l:"Own home outright",v:"Own the home outright (no mortgage)"},{l:"Boarding with family/friends",v:"Boarding with friends or family"}],next:v=>v==="Renting"?"rent_type":"rent_amount"},
        {id:"rent_type",type:"buttons",text:"Are you renting through a real estate agent or a private agreement?",key:"Renting",options:[{l:"Through an agent",v:"Through an agent"},{l:"Private agreement",v:"Private agreement"}]},
        {id:"rent_amount",type:"number",text:"Roughly how much do you pay per week for your {rentLabel}?",placeholder:"e.g. 350",key:"Week_Rent",hint:"Weekly amount in dollars",validate:v=>!isNaN(v)&&+v>=0?null:"Please enter a valid amount"},
        {id:"rent_confirm",type:"buttons",text:"So just confirming — you're paying about ${rent} per week for your {rentLabel}. Is that right?",key:"Rent_Confirm",options:[{l:"Yes, that's right",v:"Yes"},{l:"No, let me fix it",v:"No"}],next:v=>v==="No"?"rent_amount":"address_3yrs"},
        {id:"address_3yrs",type:"buttons",text:"Have you lived at this address for 3 years or more?",key:"Current_Address_Time3yrs",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="No"?"prev_address":"employed_current_work"},
        {id:"prev_address",type:"text",text:"No problem — where did you live before this?",placeholder:"Enter your previous Australian address",key:"prev_address_1"},
        {id:"prev_duration",type:"buttons",text:"How long did you live at that address?",key:"prev_address_1_duration",options:[{l:"6 months",v:"6 months"},{l:"1 year",v:"1 year"},{l:"2 years",v:"2 years"},{l:"3 years",v:"3 years"},{l:"More than 3 years",v:"More than 3 years"}],next:v=>(v==="3 years"||v==="More than 3 years")?"employed_current_work":"prev_address_2_prompt"},
        {id:"prev_address_2_prompt",type:"bot",text:"Please note: Lenders require at least 3 years of address history. I'll need one more previous address."},
        {id:"prev_address_2",type:"text",text:"Where did you live before that?",placeholder:"Enter your second previous address",key:"prev_address_2"},
        {id:"prev_duration_2",type:"buttons",text:"How long did you live at that address?",key:"prev_address_2_duration",options:[{l:"6 months",v:"6 months"},{l:"1 year",v:"1 year"},{l:"2 years",v:"2 years"},{l:"3 years",v:"3 years"},{l:"More than 3 years",v:"More than 3 years"}]},
        {id:"employed_current_work",type:"text",textFn:()=>{
            if(answers.Income_Type==="Centrelink / Government payments") return "What kind of work or activity do you do day-to-day? (e.g. carer, volunteer, studying)";
            if(answers.Income_Type==="Self-employed") return "What's your occupation or the main work you do in your business?";
            return "What's your occupation or job title?";
        },placeholder:"e.g. Nurse, Truck driver, Teacher",key:"Employed_Current_Work",validate:v=>v.trim().length>1?null:"Please describe your work or situation"},
        {id:"industry",type:"text",text:"Which industry or type of work is that in? (e.g. transport, construction, healthcare)",placeholder:"e.g. Healthcare",key:"Employed_Current_Work_Industry",next:()=>answers.Income_Type==="Centrelink / Government payments"?"centrelink_history_profile":"job_duration"},
        {id:"centrelink_history_profile",type:"buttons",text:"Have you had any regular jobs or self-employment in the last 3 years, or has it mainly been Centrelink?",key:"Centrelink_History_Profile",options:[{l:"Mainly Centrelink",v:"Mainly Centrelink"},{l:"Mix of Centrelink and work",v:"Mix of Centrelink and work"},{l:"Mainly work",v:"Mainly work"}],next:()=>"s3"},
        {id:"job_duration",type:"buttons",text:"How long have you been in this current job?",key:"Employed_Current_Job_Duration",options:[{l:"6 months",v:"6 months"},{l:"1 year",v:"1 year"},{l:"2 years",v:"2 years"},{l:"3 years",v:"3 years"},{l:"More than 3 years",v:"More than 3 years"}],next:v=>(v==="3 years"||v==="More than 3 years")?"s3":"prev_job"},
        {id:"prev_job",type:"text",text:"Lenders like to see about 3 years of work history. What were you doing before this job?",placeholder:"e.g. Administration, Sales",key:"Employed_Prev_Occupation"},
        {id:"prev_emp_type",type:"buttons",text:"Were you employed or self-employed in that role?",key:"Employed_Prev_Work_Industry",options:[{l:"Employed (PAYG)",v:"Employed (PAYG)"},{l:"Self-employed",v:"Self-employed"}]},
        {id:"prev_duration2",type:"buttons",text:"And roughly how long were you doing that for?",key:"Employed_Prev_Job_Duration",options:[{l:"6 months",v:"6 months"},{l:"1 year",v:"1 year"},{l:"2 years",v:"2 years"},{l:"3 years",v:"3 years"},{l:"More than 3 years",v:"More than 3 years"}]},
        {id:"s3",type:"section",text:"Part 3 of 3 — Financial Details"},
        {id:"s3_intro",type:"bot",textFn:()=>{
            const parts=[];
            if(answers.Has_Small_Loans==="Yes") parts.push("small loans or payday loans");
            if(answers.Has_Defaults==="Yes") parts.push("defaults or accounts in collections");
            if(parts.length>0) return "Thanks again. You mentioned earlier you have "+parts.join(" and ")+". I'll keep that in mind as we go through your financial details now.";
            return "Great — let\'s now go through your current financial position.";
        },next:()=>"confirm_loans"},
        {id:"confirm_loans",type:"buttons",textFn:()=>answers.Has_Loans==="Yes"
            ?"Earlier you mentioned you had car, personal or home loans recently. Just to confirm — is that correct? Do you have any loans at the moment?"
            :"Earlier you mentioned you had no car, personal or home loans recently. Just to confirm — is that still correct?" ,key:"Confirm_Loans",options:[{l:"No, I don't have any loans",v:"No"},{l:"Yes, I have loans",v:"Yes"}],next:v=>v==="Yes"?"loan_type":"confirm_cc_check"},
        {id:"loan_type",type:"buttons",text:"Okay, what type of loan is it?",key:"_loan_type_tmp",options:[{l:"Personal loan",v:"Personal loan"},{l:"Car loan",v:"Car loan"},{l:"Home loan",v:"Home loan"}]},
        {id:"loan_repayment",type:"number",text:"Roughly how much do you repay on that loan?",placeholder:"e.g. 350",key:"_loan_repayment_tmp",hint:"Dollar amount only",validate:v=>!isNaN(v)&&+v>0?null:"Please enter a valid amount"},
        {id:"loan_freq",type:"buttons",text:"And is that per week, per fortnight, or per month?",key:"_loan_freq_tmp",options:[{l:"Weekly",v:"Weekly"},{l:"Fortnightly",v:"Fortnightly"},{l:"Monthly",v:"Monthly"}]},
        {id:"loan_balance",type:"number",text:"Do you know roughly how much is left owing on that loan?",placeholder:"e.g. 8000",key:"_loan_balance_tmp",hint:"Dollar amount only",validate:v=>!isNaN(v)&&+v>=0?null:"Please enter a valid amount"},
        {id:"more_loans",type:"buttons",text:"Do you have any other loans as well, or is that everything?",key:"_more_loans_tmp",options:[{l:"That's the only loan",v:"No"},{l:"I have another loan",v:"Yes"}],next:v=>v==="Yes"?"loan_type":"confirm_cc_check"},
        {id:"confirm_cc_check",type:"buttons",textFn:()=>answers.Has_Credit_Cards==="Yes"
            ?"Earlier you mentioned you have a credit card. Just to confirm — is that correct? Is it just one card or do you have more than one?"
            :"Earlier you mentioned you don't have any credit cards. Just to confirm — is that still correct?",key:"Confirm_Credit_Cards",options:[{l:"No, I don't have any",v:"NoStill"},{l:"Yes, one card",v:"One"},{l:"Yes, multiple cards",v:"Multiple"}],next:v=>(v==="One"||v==="Multiple")?"cc_limit":"has_car"},
        {id:"cc_limit",type:"number",text:"What's the credit limit on that card?",placeholder:"e.g. 5000",key:"_cc_limit_tmp",hint:"Dollar amount only",validate:v=>!isNaN(v)&&+v>0?null:"Please enter a valid amount"},
        {id:"more_cc",type:"buttons",text:"Do you have any other credit cards?",key:"_more_cc_tmp",options:[{l:"No, that's all",v:"No"},{l:"Yes, another card",v:"Yes"}],next:v=>v==="Yes"?"cc_limit":"has_car"},
        {id:"has_car",type:"buttons",text:"Do you own any vehicles at the moment?",key:"Car_Asset",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"car_value":"home_asset"},
        {id:"car_value",type:"number",text:"Roughly what's the current market value of your vehicle(s)?",placeholder:"e.g. 15000",key:"Cars_Value",hint:"Total value of all vehicles",validate:v=>!isNaN(v)&&+v>=0?null:"Please enter a valid amount"},
        {id:"home_asset",type:"buttons",text:"Do you own any property or real estate?",key:"Home_Asset",options:[{l:"Yes",v:"Yes"},{l:"No",v:"No"}],next:v=>v==="Yes"?"home_value":"complete"},
        {id:"home_value",type:"number",text:"Roughly what's the current market value of your property/properties?",placeholder:"e.g. 500000",key:"Home_Value",hint:"Total value of all properties",validate:v=>!isNaN(v)&&+v>=0?null:"Please enter a valid amount"},
        {id:"complete",type:"bot",text:"Perfect! Thanks for the information {name}. I've received your application and will review your eligibility right away.\n\nYou should receive an email confirmation at {email} shortly with your results! 🚀"}
    ];
    
    const stepMap = {};
    flow.forEach(s => stepMap[s.id] = s);
    
    // Knockout conditions
    const KNOCKOUTS = {
        residency:{ trigger:v=>v==="Work Visa"||v==="Other visa (student, tourist, etc.)", message:"Thanks for letting me know. Based on the lenders we work with, we're only able to help Australian citizens and permanent residents at the moment.\n\nIf your residency status changes in the future, we'd be happy to take another look. 🙏", reason:"Residency" },
        dob:{ trigger:v=>{ if(!v)return false; const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(!m)return false; return(new Date()-new Date(+m[3],+m[2]-1,+m[1]))/(365.25*24*3600*1000)<18; }, message:"Thanks {name}. At the moment, lenders require applicants to be at least 18 years old.\n\nOnce you're over 18, we'd be glad to help you get into a car! 🚗", reason:"Under18" },
        bankrupt:{ trigger:v=>v==="Yes", message:"Thanks for being upfront. Unfortunately, lenders can't approve applications while someone is bankrupt or in a Part 9 agreement.\n\nOnce that's all cleared, we can definitely look at options for you. 🙏", reason:"Bankruptcy" },
        credit_rating:{ trigger:v=>v==="Poor"||v==="Terrible", message:"Thanks for being honest. Based on what you've told me, our main lenders are unlikely to approve this right now.\n\nWe don't want to put unnecessary enquiries on your credit file. If your situation improves, please come back — we'd love to help! 🙏", reason:"CreditScore" },
        newstart:{ trigger:v=>v==="Yes", message:"Thanks for letting me know. The lenders we work with aren't currently approving car loans where the main income is Newstart or JobSeeker.\n\nWe don't want to put any unnecessary enquiries on your credit file. 🙏", reason:"NewstartJobSeeker" },
        income_low_self:{ trigger:v=>v==="I cover everything myself", message:"Thanks for being upfront. With that income and covering all expenses yourself, lenders are unlikely to approve a car loan right now.\n\nWe'd rather be honest than waste your time or add extra enquiries to your file. If your situation changes, please come back! 🙏", reason:"IncomeLow" }
    };
    
    function initChatbot() {
        // Create chatbot HTML
        const chatbotHTML = `
            <div id="roboloans-chat-toggle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
            </div>
            
            <div id="roboloans-chat-wrapper">
                <div class="shell">
                    <div class="left-panel">
                        <div class="avatar-wrap">🤖</div>
                        <div class="left-name">Robo</div>
                        <div class="left-role">Your Roboloans AI Assistant<br>Eligibility &amp; Borrowing Power</div>
                        <div class="left-badge"><span class="online-dot"></span> Online now</div>
                        <div class="progress-side">
                            <div class="progress-side-label">
                                <span id="roboloans-progress-label">Getting started...</span>
                                <span id="roboloans-progress-pct">0%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-bar-inner" id="roboloans-progress-fill"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="right-panel">
                        <div class="chat-topbar">
                            <div class="topbar-info">
                                <div class="topbar-avatar">🤖</div>
                                <div>
                                    <div class="topbar-name">Roboloans Assistant</div>
                                    <div class="topbar-sub">Eligibility check — no credit impact</div>
                                </div>
                            </div>
                            <button class="topbar-menu" title="Menu">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                    <line x1="3" y1="6" x2="21" y2="6"/>
                                    <line x1="3" y1="12" x2="21" y2="12"/>
                                    <line x1="3" y1="18" x2="21" y2="18"/>
                                </svg>
                            </button>
                            <button class="topbar-menu" id="roboloans-close-chat" title="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="chat-messages" id="roboloans-chat-messages"></div>
                        
                        <div class="chat-input-area" id="roboloans-input-area" style="display:none;">
                            <div class="input-row">
                                <input type="text" class="chat-input" id="roboloans-chat-input" placeholder="Message..." autocomplete="off"/>
                                <button class="send-btn" id="roboloans-send-btn">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="input-hint" id="roboloans-input-hint"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#roboloans-chatbot-root').html(chatbotHTML);
        
        // Cache DOM elements
        chatMessages = $('#roboloans-chat-messages');
        inputArea = $('#roboloans-input-area');
        chatInput = $('#roboloans-chat-input');
        inputHint = $('#roboloans-input-hint');
        progressFill = $('#roboloans-progress-fill');
        progressLabel = $('#roboloans-progress-label');
        progressPct = $('#roboloans-progress-pct');
        
        bindEvents();
        checkFirstVisit();
        runStep("welcome");
    }
    
    function bindEvents() {
        $('#roboloans-chat-toggle').click(() => toggleChat());
        $('#roboloans-close-chat').click(() => closeChat());
        $('#roboloans-send-btn').click(() => handleSend());
        $('#roboloans-chat-input').keydown(e => {
            if (e.key === "Enter" && !inputLocked) handleSend();
        });
    }
    
    function toggleChat() {
        const wrapper = $('#roboloans-chat-wrapper');
        wrapper.css('display', wrapper.css('display') === 'none' ? 'block' : 'none');
    }
    
    function closeChat() {
        $('#roboloans-chat-wrapper').css('display', 'none');
    }
    
    function checkFirstVisit() {
        const hasVisited = localStorage.getItem('roboloans_chat_visited');
        if (!hasVisited) {
            setTimeout(() => {
                $('#roboloans-chat-wrapper').css('display', 'block');
                localStorage.setItem('roboloans_chat_visited', 'true');
            }, 2000);
        }
    }
    
    function interpolate(text) {
        const fn = (answers.Full_Name || "").split(" ")[0] || "";
        return text.replace(/\{name\}/g, fn)
                  .replace(/\{email\}/g, answers.Email || "")
                  .replace(/\{mobile\}/g, answers.Mobile || "")
                  .replace(/\{rent\}/g, answers.Week_Rent || "")
                  .replace(/\{rentLabel\}/g, answers.Renting === "Through an agent" ? "rental" : "rent")
                  .replace(/\{childCount\}/g, answers.Children_No || "0");
    }
    
    function scrollBottom() {
        setTimeout(() => {
            if (chatMessages && chatMessages.length > 0) {
                chatMessages.scrollTop(chatMessages[0].scrollHeight);
            }
        }, 80);
    }
    
    function updateProgress() {
        const ds = flow.filter(s => s.key);
        const pct = Math.round((ds.filter(s => answers[s.key] !== undefined).length / ds.length) * 100);
        progressFill.css('width', pct + '%');
        progressPct.text(pct + '%');
        
        if (pct < 25) progressLabel.text("Getting started...");
        else if (pct < 50) progressLabel.text("Basic info...");
        else if (pct < 75) progressLabel.text("Financial details...");
        else if (pct < 100) progressLabel.text("Almost done...");
        else progressLabel.text("Complete!");
    }
    
    function showInputArea(show, placeholder, hint) {
        placeholder = placeholder || "Type your answer...";
        hint = hint || "";
        inputArea.css('display', show ? 'block' : 'none');
        if (show) {
            chatInput.prop('placeholder', placeholder);
            inputHint.text(hint);
            chatInput.val('');
            setTimeout(() => chatInput.focus(), 100);
        }
    }
    
    function addBotBubble(text) {
        return new Promise(resolve => {
            const typingHTML = '<div class="msg bot"><div class="msg-avatar">🤖</div><div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>';
            chatMessages.append(typingHTML);
            scrollBottom();
            
            setTimeout(() => {
                chatMessages.find('.msg.bot:last').remove();
                const messageHTML = '<div class="msg bot"><div class="msg-avatar">🤖</div><div class="bubble">' + interpolate(text).replace(/\n/g, "<br>") + '</div></div>';
                chatMessages.append(messageHTML);
                scrollBottom();
                resolve();
            }, 800);
        });
    }
    
    function addUserBubble(text) {
        const userHTML = '<div class="msg user"><div class="bubble">' + text + '</div></div>';
        chatMessages.append(userHTML);
        scrollBottom();
    }
    
    function showButtons(options, onSelect) {
        const btnGroup = $('<div class="btn-group"></div>');
        
        options.forEach(opt => {
            const label = opt.l || opt;
            const value = opt.v || opt;
            
            const button = $('<button class="choice-btn">' + label + '</button>');
            button.click(() => {
                btnGroup.find('.choice-btn').each(() => {
                    $(this).removeClass('selected').prop('disabled', true);
                });
                button.addClass('selected');
                onSelect(value, label);
            });
            
            btnGroup.append(button);
        });
        
        chatMessages.append(btnGroup);
        scrollBottom();
    }
    
    function showError(message) {
        const errorHTML = '<div class="msg bot"><div class="msg-avatar">🤖</div><div class="bubble error-bubble">⚠️ ' + message + '</div></div>';
        chatMessages.append(errorHTML);
        scrollBottom();
    }
    
    async function runStep(stepId) {
        console.log('Running step:', stepId);
        
        if (!stepId || isKnockedOut) {
            showInputArea(false);
            return;
        }
        
        const step = stepMap[stepId];
        if (!step) {
            showInputArea(false);
            return;
        }
        
        currentStepId = stepId;
        updateProgress();
        inputLocked = true;
        showInputArea(false);
        
        // Handle knockout conditions
        if (step.knockout && KNOCKOUTS[step.knockout]) {
            const ko = KNOCKOUTS[step.knockout];
            const val = answers[step.key];
            console.log('Checking knockout:', step.knockout, 'value:', val, 'trigger:', ko.trigger(val));
            if (ko.trigger(val)) {
                isKnockedOut = true;
                await addBotBubble(interpolate(ko.message));
                return;
            }
        }
        
        // Handle section headers
        if (step.type === "section") {
            await addBotBubble(step.text);
            const nextIndex = flow.findIndex(s => s.id === stepId) + 1;
            if (nextIndex < flow.length) {
                setTimeout(() => runStep(flow[nextIndex].id), 500);
            }
            return;
        }
        
        // Handle bot messages
        if (step.type === "bot") {
            const botText = step.textFn ? step.textFn() : interpolate(step.text);
            await addBotBubble(botText);
            
            if (step.pauseMs) {
                await new Promise(resolve => setTimeout(resolve, step.pauseMs));
            }
            
            if (step.id === "complete") {
                sendToWordPress();
                return;
            }
            
            const nextStep = step.next ? (typeof step.next === 'function' ? step.next() : step.next) : null;
            if (nextStep) {
                setTimeout(() => runStep(nextStep), 1000);
            } else {
                const nextIndex = flow.findIndex(s => s.id === stepId) + 1;
                if (nextIndex < flow.length) {
                    setTimeout(() => runStep(flow[nextIndex].id), 1000);
                }
            }
            return;
        }
        
        // Handle input steps
        const stepText = step.textFn ? step.textFn() : interpolate(step.text);
        await addBotBubble(stepText);
        
        if (step.type === "buttons") {
            inputLocked = false;
            const options = step.getDynamicOptions ? getDynamicOptions() : step.options;
            showButtons(options, (val, label) => {
                addUserBubble(label);
                if (step.key) answers[step.key] = val;
                
                // Check knockout conditions after button click
                if (step.knockout && KNOCKOUTS[step.knockout]) {
                    const ko = KNOCKOUTS[step.knockout];
                    console.log('Checking knockout after button click:', step.knockout, 'value:', val, 'trigger:', ko.trigger(val));
                    if (ko.trigger(val)) {
                        isKnockedOut = true;
                        showInputArea(false);
                        setTimeout(async () => {
                            await addBotBubble(interpolate(ko.message));
                            // Submit to Zoho when chat ends due to knockout
                            sendToWordPress();
                        }, 500);
                        return;
                    }
                }
                
                const nextStep = step.next ? (typeof step.next === 'function' ? step.next(val) : step.next) : null;
                if (nextStep) {
                    setTimeout(() => runStep(nextStep), 500);
                } else {
                    const nextIndex = flow.findIndex(s => s.id === stepId) + 1;
                    if (nextIndex < flow.length) {
                        setTimeout(() => runStep(flow[nextIndex].id), 500);
                    }
                }
            });
        } else {
            showInputArea(true, step.placeholder || "Type your answer...", step.hint || "");
            inputLocked = false;
        }
    }
    
    function handleSend() {
        console.log('handleSend called, currentStepId:', currentStepId);
        
        const val = chatInput.val().trim();
        if (!val || inputLocked) return;
        
        const step = stepMap[currentStepId];
        if (!step) return;
        
        console.log('Step found:', step);
        
        // Validate input
        if (step.validate) {
            const err = step.validate(val);
            if (err) {
                showError(err);
                return;
            }
        }
        
        addUserBubble(val);
        chatInput.val('');
        
        if (step.key) answers[step.key] = val;
        showInputArea(false);
        
        // Move to next step
        const nextStep = step.next ? (typeof step.next === 'function' ? step.next() : step.next) : null;
        if (nextStep) {
            setTimeout(() => runStep(nextStep), 500);
        } else {
            const nextIndex = flow.findIndex(s => s.id === currentStepId) + 1;
            console.log('Moving to next index:', nextIndex);
            
            if (nextIndex < flow.length) {
                setTimeout(() => runStep(flow[nextIndex].id), 500);
            }
        }
    }
    
    function sendToWordPress() {
        if (isDataSent) return;
        isDataSent = true;
        
        console.log('Sending to WordPress:', answers);
        
        // Add knockout status to answers
        answers.Knocked_Out = isKnockedOut;
        answers.Knockout_Reason = isKnockedOut ? findKnockoutReason() : '';
        
        // Send via External Server
        $.ajax({
            url: 'http://localhost:3000/api/submit',
            type: 'POST',
            data: JSON.stringify({
                data: answers
            }),
            contentType: 'application/json',
            success: function(response) {
                console.log('AJAX Response:', response);
                if (response.success) {
                    console.log('Application submitted successfully:', response.data);
                    if (!isKnockedOut) {
                        addBotBubble("✅ Application submitted successfully! We'll contact you soon.");
                    }
                } else {
                    console.error('Submission failed:', response.data);
                    addBotBubble("❌ There was an error submitting your application. Please try again.");
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                console.log('Response Text:', xhr.responseText);
                addBotBubble("❌ Network error. Please check your connection and try again.");
            }
        });
    }
    
    function findKnockoutReason() {
        if (!isKnockedOut) return '';
        
        // Check which knockout was triggered
        if (answers.Residency && (answers.Residency === "Work Visa" || answers.Residency === "Other visa (student, tourist, etc.)")) {
            return "Residency";
        }
        if (answers.Bankrupt_Part9 === "Yes") return "Bankruptcy";
        if (answers.Self_Rated_Credit && (answers.Self_Rated_Credit === "Poor" || answers.Self_Rated_Credit === "Terrible")) {
            return "CreditScore";
        }
        if (answers.New_Start === "Yes") return "NewstartJobSeeker";
        if (answers.Share_Expenses === "I cover everything myself") return "IncomeLow";
        
        return "Unknown";
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        console.log('Document ready, checking for chatbot root...');
        
        if ($('#roboloans-chatbot-root').length > 0) {
            console.log('Chatbot root found, initializing...');
            
            if (typeof roboloans_vars !== "undefined") {
                console.log('roboloans_vars found:', roboloans_vars);
                initChatbot();
            } else {
                console.error('roboloans_vars not defined');
            }
        } else {
            console.error('roboloans-chatbot-root not found');
        }
    });
    
})(jQuery);
