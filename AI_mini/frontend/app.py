import streamlit as st
import requests
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = "http://localhost:8000"

st.set_page_config(page_title="Personal Expense Tracker", page_icon="💰", layout="wide")

st.title("💰 Personal Expense Tracker with Multimodal AI")

# Upload Section
st.header("1. Upload Receipt or Bank Statement")
uploaded_file = st.file_uploader("Drag and drop your receipt image or PDF bank statement", type=["jpg", "png", "jpeg", "pdf"])

if 'extracted_data' not in st.session_state:
    st.session_state.extracted_data = None

if uploaded_file is not None:
    if st.button("Extract Data with Gemini"):
        with st.spinner("Extracting..."):
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
            response = requests.post(f"{BACKEND_URL}/upload", files=files)
            if response.status_code == 200:
                st.session_state.extracted_data = response.json()
                st.success("Extraction successful!")
            else:
                st.error(f"Error: {response.text}")

# Review Section
if st.session_state.extracted_data is not None:
    st.header("2. Review and Edit")
    df = pd.DataFrame(st.session_state.extracted_data)
    edited_df = st.data_editor(df, num_rows="dynamic")
    
    if st.button("Save to Database"):
        with st.spinner("Saving..."):
            saved_count = 0
            for index, row in edited_df.iterrows():
                try:
                    expense_data = {
                        "date": str(row.get("date", "2024-01-01")),
                        "merchant": str(row.get("merchant", "")),
                        "total": float(row.get("total", 0.0)),
                        "category": str(row.get("category", ""))
                    }
                    res = requests.post(f"{BACKEND_URL}/expenses/", json=expense_data)
                    if res.status_code == 200:
                        saved_count += 1
                    else:
                        st.error(f"Failed to save row {index}: {res.text}")
                except Exception as e:
                    st.error(f"Error preparing row {index}: {e}")
            
            if saved_count > 0:
                st.success(f"Saved {saved_count} expenses!")
                st.session_state.extracted_data = None # clear after save
                st.rerun()

st.divider()

# Summary Section
st.header("3. Spending Summary")
if st.button("Generate AI Insights"):
    with st.spinner("Analyzing your finances..."):
        # We send the current session_state data (if any) to get the "Current Upload" insight
        current_payload = st.session_state.extracted_data if st.session_state.extracted_data else None
        
        summary_res = requests.post(f"{BACKEND_URL}/summary", json=current_payload)
        
        if summary_res.status_code == 200:
            # Displays both summaries as returned by the LLM
            st.info(summary_res.json()["summary"])
        else:
            st.error("Could not generate insights.")
try:
    expenses_res = requests.get(f"{BACKEND_URL}/expenses/")
    if expenses_res.status_code == 200:
        expenses_list = expenses_res.json()
        if expenses_list:
            exp_df = pd.DataFrame(expenses_list)
            exp_df['date'] = pd.to_datetime(exp_df['date'])
            
            # Date Filters
            st.subheader("Filter by Date")
            col1, col2 = st.columns(2)
            min_date = exp_df['date'].min().date()
            max_date = exp_df['date'].max().date()
            
            with col1:
                start_date = st.date_input("Start Date", min_date, min_value=min_date, max_value=max_date)
            with col2:
                end_date = st.date_input("End Date", max_date, min_value=min_date, max_value=max_date)
                
            mask = (exp_df['date'].dt.date >= start_date) & (exp_df['date'].dt.date <= end_date)
            filtered_df = exp_df.loc[mask]
            
            st.subheader("All Expenses")
            st.dataframe(filtered_df)
            
            # Visualizations
            st.subheader("Spending Analysis")
            col_chart1, col_chart2 = st.columns(2)
            
            with col_chart1:
                summary_df = filtered_df.groupby("category")["total"].sum().reset_index()
                fig_cat = px.bar(summary_df, x="category", y="total", color="category", title="Spending by Category")
                st.plotly_chart(fig_cat, use_container_width=True)
                
            with col_chart2:
                timeline_df = filtered_df.groupby("date")["total"].sum().reset_index()
                fig_time = px.line(timeline_df, x="date", y="total", markers=True, title="Spending Timeline")
                st.plotly_chart(fig_time, use_container_width=True)
                
        else:
            st.info("No expenses found in the database yet.")
except Exception as e:
    st.error(f"Could not connect to backend to fetch expenses: {e}")

st.divider()

# Chatbot Section
st.header("4. Chat with AI Assistant")
st.write("Ask questions about your saved expenses!")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask a question about your expenses..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                res = requests.post(f"{BACKEND_URL}/chat", json={"message": prompt})
                if res.status_code == 200:
                    reply = res.json()["reply"]
                    st.markdown(reply)
                    st.session_state.messages.append({"role": "assistant", "content": reply})
                else:
                    st.error(f"Error: {res.text}")
            except Exception as e:
                st.error(f"Connection error: {e}")
