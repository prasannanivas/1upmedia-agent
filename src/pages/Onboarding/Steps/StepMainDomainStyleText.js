export const STYLE_TEXT = `
        .step-main-domain__business-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
          border-radius: 16px;
          padding: 24px;
          margin-top: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 5px rgba(0, 0, 0, 0.03);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .step-main-domain__business-card:hover {
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12), 0 5px 15px rgba(59, 130, 246, 0.05);
          transform: translateY(-5px);
        }
        
        .step-main-domain__business-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .step-main-domain__subtitle {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          margin: 0;
        }
        
        .step-main-domain__edit-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }
        
        .step-main-domain__edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
        }
        
        .step-main-domain__business-textarea {
          width: 100%;
          min-height: 350px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.7;
          font-family: 'Courier New', monospace;
          transition: all 0.3s ease;
          background-color: #fafbff;
          color: #334155;
        }
        
        .step-main-domain__business-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          background-color: #fff;
        }
        
        .step-main-domain__business-formatted {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        
        .step-main-domain__business-section {
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 24px;
          position: relative;
          margin-bottom: 8px;
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .step-main-domain__business-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        
        .step-main-domain__business-section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(59, 130, 246, 0.5);
          display: inline-block;
          position: relative;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .step-main-domain__business-section-title::before {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 70%;
          height: 2px;
          background: linear-gradient(to right, #3b82f6, rgba(59, 130, 246, 0.1));
        }
        
        .step-main-domain__business-section-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-left: 8px;
        }
        
        .step-main-domain__business-detail-row {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 10px;
          padding: 8px 12px;
          position: relative;
          gap: 12px;
          border-radius: 8px;
          transition: all 0.25s ease;
          background-color: rgba(241, 245, 249, 0.4);
          border-left: 3px solid rgba(59, 130, 246, 0.3);
        }
        
        .step-main-domain__business-detail-row:hover {
          background-color: rgba(241, 245, 249, 0.9);
          border-left: 3px solid rgba(59, 130, 246, 0.8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transform: translateX(2px);
        }
        
        .step-main-domain__business-detail-key {
          color: #334155;
          font-weight: 700;
          min-width: 160px;
          position: relative;
          display: inline-block;
          font-size: 0.95rem;
        }
        
        .step-main-domain__business-detail-key:after {
          content: ":";
          position: absolute;
          right: 0;
          color: #64748b;
        }
        
        .step-main-domain__business-detail-value {
          color: #0f172a;
          flex: 1;
          font-weight: 500;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .step-main-domain__business-list-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 6px 8px;
          border-radius: 6px;
          animation: slideIn 0.4s ease;
          transition: all 0.2s ease;
        }
        
        .step-main-domain__business-list-item:hover {
          background-color: rgba(241, 245, 249, 0.9);
          transform: translateX(3px);
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .step-main-domain__business-bullet {
          color: #fff;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          font-size: 0.8rem;
          line-height: 1.6;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 3px;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        
        .step-main-domain__business-number {
          color: #fff;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          font-weight: 600;
          min-width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
          font-size: 0.8rem;
        }
        
        .step-main-domain__business-placeholder {
          color: #94a3b8;
          font-style: italic;
          text-align: center;
          padding: 40px 0;
          border: 2px dashed #e2e8f0;
          border-radius: 10px;
          margin: 20px 0;
          background-color: rgba(241, 245, 249, 0.5);
        }
        
        .step-main-domain__edit-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        
        .step-main-domain__save-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }
        
        .step-main-domain__save-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
        }
        
        .step-main-domain__cancel-btn {
          background: transparent;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .step-main-domain__cancel-btn:hover {
          background: #f8fafc;
          color: #334155;
          border-color: #94a3b8;
        }
        
        .step-main-domain__side-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 24px;
          height: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          transition: all 0.4s ease;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .step-main-domain__side-section:hover {
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
        }
      `;
